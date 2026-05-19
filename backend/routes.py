import os

from flask import Blueprint, current_app, jsonify

from metrics import compute_topline
from sheets import FollowerRow, get_instagram_rows, get_rows

bp = Blueprint("api", __name__, url_prefix="/api")


def _serialize_rows(rows: list[FollowerRow]) -> list[dict]:
    return [
        {
            "date": r.date.isoformat(),
            "total_followers": r.total_followers,
            "new_followers": r.new_followers,
            "growth_rate": r.growth_rate,
        }
        for r in rows
    ]


def _payload(rows: list[FollowerRow]) -> dict:
    target = current_app.config["MONTHLY_TARGET"]
    return {
        "rows": _serialize_rows(rows),
        "topline": compute_topline(rows, target),
    }


def _instagram_payload(rows: list[FollowerRow]) -> dict:
    target = int(os.environ.get("INSTAGRAM_MONTHLY_TARGET", "0"))
    return {
        "rows": _serialize_rows(rows),
        "topline": compute_topline(rows, target),
    }


@bp.get("/health")
def health():
    return jsonify({"ok": True})


@bp.get("/followers")
def followers():
    return jsonify(_payload(get_rows()))


@bp.post("/refresh")
def refresh():
    return jsonify(_payload(get_rows(force_refresh=True)))


@bp.get("/instagram")
def instagram():
    return jsonify(_instagram_payload(get_instagram_rows()))


@bp.post("/instagram/refresh")
def instagram_refresh():
    return jsonify(_instagram_payload(get_instagram_rows(force_refresh=True)))
