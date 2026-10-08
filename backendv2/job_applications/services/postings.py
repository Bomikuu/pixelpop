"""Import only public HTTPS pages from explicitly configured, permitted hosts."""
import http.client
import ipaddress
import os
import socket
import ssl
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit

from rest_framework.exceptions import ValidationError


class PostingParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.skip = 0
        self.parts = []

    def handle_starttag(self, tag, attrs):
        if tag in {"script", "style", "nav", "footer", "header"}:
            self.skip += 1
        elif tag in {"p", "div", "li", "br", "h1", "h2", "h3"} and not self.skip:
            self.parts.append("\n")

    def handle_endtag(self, tag):
        if tag in {"script", "style", "nav", "footer", "header"} and self.skip:
            self.skip -= 1

    def handle_data(self, data):
        if not self.skip and data.strip():
            self.parts.append(data.strip() + " ")


class PinnedHTTPSConnection(http.client.HTTPSConnection):
    def __init__(self, host, address):
        super().__init__(host, timeout=8, context=ssl.create_default_context())
        self.address = address

    def connect(self):
        sock = socket.create_connection((self.address, 443), timeout=self.timeout)
        self.sock = self._context.wrap_socket(sock, server_hostname=self.host)


def import_posting(url):
    allowed = {host.strip().lower() for host in os.getenv("JOB_APPLICATION_IMPORT_HOSTS", "").split(",") if host.strip()}
    def unavailable(code, message, status=None):
        result = {"imported": False, "posting": "", "code": code, "message": message + " Paste the job description and screening questions to continue."}
        if status is not None:
            result["http_status"] = status
        return result

    for attempt in range(4):
        try:
            parsed = urlsplit(url)
            if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password or parsed.port not in (None, 443):
                raise ValidationError({"url": "Use a public HTTPS posting link."})
            host = parsed.hostname.lower()
            if host not in allowed:
                if any("://" in item for item in allowed):
                    return unavailable("host_configuration", "JOB_APPLICATION_IMPORT_HOSTS contains a URL instead of a hostname. Use hostnames only (no https://), then restart or redeploy Django.")
                return unavailable("redirect_not_allowed" if attempt else "host_not_allowed", f"{'The page redirected to' if attempt else 'Posting imports are not enabled for'} {host}, which is not in JOB_APPLICATION_IMPORT_HOSTS. Hostnames must match exactly; review the backend allowlist and restart or redeploy Django.")
            addresses = {info[4][0] for info in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)}
            if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
                raise ValidationError({"url": "Private or internal network addresses cannot be imported."})
            connection = PinnedHTTPSConnection(host, sorted(addresses)[0])
            try:
                connection.request("GET", (parsed.path or "/") + ("?" + parsed.query if parsed.query else ""), headers={"Accept": "text/html", "User-Agent": "PixelPopup-JobPosting/1.0"})
                response = connection.getresponse()
                if response.status in {301, 302, 303, 307, 308}:
                    location = response.getheader("Location")
                    if not location:
                        return unavailable("invalid_redirect", f"{host} returned HTTP {response.status} without a redirect destination.", response.status)
                    url = urljoin(url, location)
                    continue
                if response.status != 200:
                    reasons = {
                        401: "The site requires authentication; this importer cannot sign in.",
                        403: "The site refused the backend request. An access restriction or anti-bot protection may be blocking it; this importer cannot complete browser challenges.",
                        404: "The posting was not found at this URL.",
                        410: "The posting is no longer available at this URL.",
                        429: "The site is rate-limiting requests. Wait before retrying.",
                    }
                    reason = reasons.get(response.status, "The website reported a server error. Try again later." if response.status >= 500 else "The website returned an unsupported response.")
                    return unavailable("http_error", f"{host} returned HTTP {response.status}. {reason}", response.status)
                if "text/html" not in response.getheader("Content-Type", "").lower():
                    return unavailable("unsupported_content", f"{host} did not return an HTML page. Use the public job-posting page, not a file or API link.")
                raw = response.read(1_000_001)
                if len(raw) > 1_000_000:
                    return unavailable("page_too_large", f"The page from {host} exceeds the importer's 1 MB limit.")
            finally:
                connection.close()
            parser = PostingParser()
            parser.feed(raw.decode("utf-8", errors="replace"))
            text = "\n".join(line.strip() for line in "".join(parser.parts).splitlines() if line.strip())
            if len(text) < 100:
                return unavailable("no_readable_text", f"{host} returned HTML, but less than 100 characters of readable text were found. The description may require JavaScript or login; this importer reads public HTML only.")
            return {"imported": True, "posting": text[:30000], "message": "Review the imported text and remove unrelated content before generating."}
        except ValidationError:
            raise
        except socket.gaierror:
            return unavailable("dns_error", "The backend could not resolve the website's hostname. Check the link and try again later.")
        except TimeoutError:
            return unavailable("timeout", "The website did not respond within the importer's 8-second network timeout. Try again later.")
        except ssl.SSLError:
            return unavailable("tls_error", "A secure HTTPS connection to the website could not be established or its certificate could not be verified.")
        except http.client.HTTPException:
            return unavailable("invalid_response", "The website returned an incomplete or invalid HTTP response.")
        except OSError:
            return unavailable("connection_error", "The backend could not connect to the website, or the connection was interrupted. Check the link and try again later.")
        except ValueError:
            return unavailable("invalid_page", "The posting URL or returned page could not be parsed. Check the public HTTPS link.")
    return unavailable("too_many_redirects", "The website exceeded the importer's four-request redirect limit. Use the final public posting URL.")
