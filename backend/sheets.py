import os
import time
from dataclasses import dataclass
from datetime import date, datetime
from typing import Optional

from google.oauth2 import service_account
from googleapiclient.discovery import build

SCOPES = ["https://www.googleapis.com/auth/spreadsheets.readonly"]
CACHE_TTL_SECONDS = 300
DEFAULT_RANGE = "Sheet1!A:D"


@dataclass(frozen=True)
class FollowerRow:
    date: date
    total_followers: int
    new_followers: int
    growth_rate: float


_cache: dict = {"rows": None, "fetched_at": 0.0}


def _service():
    creds = service_account.Credentials.from_service_account_file(
        os.environ["GOOGLE_APPLICATION_CREDENTIALS"],
        scopes=SCOPES,
    )
    return build("sheets", "v4", credentials=creds, cache_discovery=False)


def _parse_int(raw) -> int:
    s = str(raw or "").strip().replace(",", "")
    if not s:
        return 0
    try:
        return int(float(s))
    except ValueError:
        return 0


def _parse_float(raw) -> float:
    s = str(raw or "").strip().replace("%", "").replace(",", "")
    if not s:
        return 0.0
    try:
        return float(s)
    except ValueError:
        return 0.0


def _parse_date(raw) -> Optional[date]:
    s = str(raw or "").strip()
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%d/%m/%Y", "%b %d, %Y", "%d %b %Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _fetch_rows() -> list[FollowerRow]:
    sheet_id = os.environ["SHEET_ID"]
    sheet_range = os.environ.get("SHEET_RANGE", DEFAULT_RANGE)

    result = (
        _service()
        .spreadsheets()
        .values()
        .get(spreadsheetId=sheet_id, range=sheet_range)
        .execute()
    )

    values = result.get("values", [])
    if len(values) < 2:
        return []

    rows: list[FollowerRow] = []
    for raw in values[1:]:  # skip header row
        cells = (list(raw) + ["", "", "", ""])[:4]
        d = _parse_date(cells[0])
        if d is None:
            continue
        rows.append(
            FollowerRow(
                date=d,
                total_followers=_parse_int(cells[1]),
                new_followers=_parse_int(cells[2]),
                growth_rate=_parse_float(cells[3]),
            )
        )

    rows.sort(key=lambda r: r.date)
    return rows


def get_rows(force_refresh: bool = False) -> list[FollowerRow]:
    now = time.time()
    cached = _cache["rows"]
    fresh = cached is not None and (now - _cache["fetched_at"]) < CACHE_TTL_SECONDS
    if force_refresh or not fresh:
        _cache["rows"] = _fetch_rows()
        _cache["fetched_at"] = now
    return _cache["rows"] or []
