import json
import os
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.core.cache import cache
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


GITHUB_USERNAME = "Bomikuu"
GITHUB_QUERY = """
query($login: String!, $from: DateTime!, $to: DateTime!) {
  user(login: $login) {
    contributionsCollection(from: $from, to: $to) {
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            date
            contributionCount
          }
        }
      }
    }
  }
}
"""


def unavailable_response():
    response = Response({"error": "GITHUB_ACTIVITY_UNAVAILABLE"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
    response["Cache-Control"] = "no-store"
    return response


@api_view(["GET"])
@permission_classes([AllowAny])
def github_activity(request):
    current_year = datetime.now(timezone.utc).year
    try:
        year = int(request.query_params.get("year", current_year))
    except (TypeError, ValueError):
        return Response({"error": "INVALID_YEAR"}, status=status.HTTP_400_BAD_REQUEST)

    if year < current_year - 3 or year > current_year:
        return Response({"error": "INVALID_YEAR"}, status=status.HTTP_400_BAD_REQUEST)

    token = os.getenv("GITHUB_ACTIVITY_TOKEN", "").strip()
    if not token:
        return unavailable_response()

    cache_key = f"portfolio:github-activity:{GITHUB_USERNAME}:{year}"
    cached = cache.get(cache_key)
    if cached is not None:
        response = Response(cached)
        response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
        return response

    payload = {
        "query": GITHUB_QUERY,
        "variables": {
            "login": GITHUB_USERNAME,
            "from": f"{year}-01-01T00:00:00Z",
            "to": f"{year}-12-31T23:59:59Z",
        },
    }
    github_request = Request(
        "https://api.github.com/graphql",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Accept": "application/vnd.github+json",
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "User-Agent": "PixelPopup-Portfolio",
        },
        method="POST",
    )

    try:
        with urlopen(github_request, timeout=10) as github_response:
            github_data = json.load(github_response)
        if github_data.get("errors"):
            raise ValueError("GitHub returned GraphQL errors")
        calendar = github_data["data"]["user"]["contributionsCollection"]["contributionCalendar"]
        days = [
            {"date": day["date"], "count": day["contributionCount"]}
            for week in calendar["weeks"]
            for day in week["contributionDays"]
            if day["date"].startswith(f"{year}-")
        ]
    except (HTTPError, URLError, TimeoutError, ValueError, KeyError, TypeError):
        return unavailable_response()

    result = {
        "username": GITHUB_USERNAME,
        "year": year,
        "totalContributions": calendar["totalContributions"],
        "days": days,
    }
    cache.set(cache_key, result, 3600)
    response = Response(result)
    response["Cache-Control"] = "public, max-age=300, s-maxage=3600"
    return response
