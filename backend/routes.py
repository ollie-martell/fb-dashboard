from flask import Blueprint, current_app, jsonify

from metrics import compute_topline
from sheets import FollowerRow, get_rows

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


@bp.get("/health")
def health():
    return jsonify({"ok": True})


@bp.get("/followers")
def followers():
    return jsonify(_payload(get_rows()))


@bp.post("/refresh")
def refresh():
    return jsonify(_payload(get_rows(force_refresh=True)))
