import os

from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS

from routes import bp as api_bp


def create_app() -> Flask:
    load_dotenv()

    app = Flask(__name__)
    app.config.update(
        MONTHLY_TARGET=int(os.environ.get("MONTHLY_TARGET", "168000")),
    )

    origins = [
        o.strip()
        for o in os.environ.get("ALLOWED_ORIGINS", "").split(",")
        if o.strip()
    ]
    CORS(app, origins=origins or "*")

    app.register_blueprint(api_bp)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=int(os.environ.get("PORT", "5001")), debug=True)
