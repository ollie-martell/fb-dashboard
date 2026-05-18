import calendar
from datetime import date, timedelta

from sheets import FollowerRow


def _format_range(start: date, end: date) -> str:
    if start.month == end.month and start.year == end.year:
        return f"{start.day}–{end.day} {start.strftime('%b')}"
    return f"{start.day} {start.strftime('%b')} – {end.day} {end.strftime('%b')}"


def _empty(monthly_target: int) -> dict:
    return {
        "yesterday": {"value": 0, "date": ""},
        "wtd": {"value": 0, "date_range": "", "prior_week_value": 0, "delta_pct": 0.0},
        "mtd": {
            "value": 0,
            "target": monthly_target,
            "pct_to_target": 0.0,
            "pace_delta_pct": 0.0,
            "projection": 0,
        },
        "total_followers": 0,
        "as_of": "",
    }


def compute_topline(rows: list[FollowerRow], monthly_target: int) -> dict:
    if not rows:
        return _empty(monthly_target)

    latest = rows[-1]
    by_date = {r.date: r for r in rows}

    # Yesterday — most recent row in the sheet
    yesterday = {"value": latest.new_followers, "date": latest.date.isoformat()}

    # WTD: Monday-of-latest's-week through latest. ISO weekday: Mon=1, Sun=7.
    iso_weekday = latest.date.isoweekday()
    week_start = latest.date - timedelta(days=iso_weekday - 1)
    wtd_days = [week_start + timedelta(days=i) for i in range((latest.date - week_start).days + 1)]
    wtd_value = sum(by_date[d].new_followers for d in wtd_days if d in by_date)

    # Prior week: matching weekdays one week earlier (apples-to-apples)
    prior_days = [d - timedelta(days=7) for d in wtd_days]
    prior_week_value = sum(by_date[d].new_followers for d in prior_days if d in by_date)

    delta_pct = (
        ((wtd_value - prior_week_value) / prior_week_value) * 100.0
        if prior_week_value > 0
        else 0.0
    )

    # MTD
    month_start = latest.date.replace(day=1)
    days_in_month = calendar.monthrange(latest.date.year, latest.date.month)[1]
    days_elapsed = (latest.date - month_start).days + 1

    mtd_value = sum(
        r.new_followers for r in rows if month_start <= r.date <= latest.date
    )

    pct_to_target = (mtd_value / monthly_target) * 100.0 if monthly_target > 0 else 0.0

    expected_mtd = monthly_target * (days_elapsed / days_in_month)
    pace_delta_pct = (
        ((mtd_value - expected_mtd) / expected_mtd) * 100.0 if expected_mtd > 0 else 0.0
    )

    daily_rate = mtd_value / days_elapsed if days_elapsed > 0 else 0.0
    projection = round(daily_rate * days_in_month)

    return {
        "yesterday": yesterday,
        "wtd": {
            "value": wtd_value,
            "date_range": _format_range(week_start, latest.date),
            "prior_week_value": prior_week_value,
            "delta_pct": round(delta_pct, 1),
        },
        "mtd": {
            "value": mtd_value,
            "target": monthly_target,
            "pct_to_target": round(pct_to_target, 1),
            "pace_delta_pct": round(pace_delta_pct, 1),
            "projection": projection,
        },
        "total_followers": latest.total_followers,
        "as_of": latest.date.isoformat(),
    }
