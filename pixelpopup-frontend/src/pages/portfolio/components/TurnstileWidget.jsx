import { useEffect, useRef } from "react";

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";
const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function isConfigured(value) {
  return Boolean(value && !value.includes("<key here>"));
}

export default function TurnstileWidget({ onTokenChange, action = "portfolio-contact" }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  const configured = isConfigured(siteKey);

  useEffect(() => {
    if (!configured) return undefined;

    let cancelled = false;
    let scriptElement = null;
    let observer = null;

    const renderWidget = () => {
      if (cancelled || !containerRef.current || !window.turnstile) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        action,
        theme: "light",
        size: "flexible",
        callback: onTokenChange,
        "expired-callback": () => onTokenChange(""),
        "error-callback": () => onTokenChange(""),
      });
    };

    const loadWidget = () => {
      if (window.turnstile) {
        renderWidget();
        return;
      }
      scriptElement = document.getElementById(TURNSTILE_SCRIPT_ID);
      if (!scriptElement) {
        scriptElement = document.createElement("script");
        scriptElement.id = TURNSTILE_SCRIPT_ID;
        scriptElement.src = TURNSTILE_SCRIPT_URL;
        scriptElement.async = true;
        scriptElement.defer = true;
        document.head.appendChild(scriptElement);
      }
      scriptElement.addEventListener("load", renderWidget, { once: true });
    };

    if (window.IntersectionObserver && containerRef.current) {
      observer = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadWidget();
      }, { rootMargin: "600px" });
      observer.observe(containerRef.current);
    } else {
      loadWidget();
    }

    return () => {
      cancelled = true;
      observer?.disconnect();
      scriptElement?.removeEventListener("load", renderWidget);
      if (widgetIdRef.current !== null && window.turnstile?.remove) {
        window.turnstile.remove(widgetIdRef.current);
      }
      onTokenChange("");
    };
  }, [action, configured, onTokenChange, siteKey]);

  if (!configured) {
    return (
      <p className="mt-5 text-sm" role="status">
        Bot protection is waiting for the Turnstile site key.
      </p>
    );
  }

  return (
    <div className="mt-5" aria-label="Bot protection verification">
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}
