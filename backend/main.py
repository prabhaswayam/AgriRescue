from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import subprocess
import json
from urllib.parse import urlencode
from pathlib import Path

API_URL = "https://mandi-api.onrender.com/v1"

app = FastAPI(
    title="AgriRescue API",
    description="Agricultural market intelligence backend",
    version="0.5.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


FRONTEND_DIR = Path(__file__).resolve().parent.parent / "frontend"
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def home():
    return FileResponse(FRONTEND_DIR / "index.html")

@app.get("/api/mandi")
def get_mandi_prices(
    state: str = "Maharashtra",
    commodity: str = "Tomato",
    limit: int = Query(default=50, ge=1, le=200)
):
    params = {
        "state": state,
        "commodity": commodity
    }


    params = urlencode({
        "state": state,
        "commodity": commodity
    })
    url = f"{API_URL}/prices?{params}"

    try:
        response = subprocess.run(
            [
                "curl",
                "--http1.1",
                "-sS",
                "--fail",
                "--max-time", "30",
                url
            ],
            capture_output=True,
            text=True,
            timeout=35,
            check=True
        )
        data = json.loads(response.stdout)

    except (subprocess.SubprocessError, OSError):
        raise HTTPException(
            status_code=502,
            detail="Mandi data service is temporarily unavailable."
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=502,
            detail="Mandi data service returned invalid JSON."
        )

        raise HTTPException(
            status_code=502,
            detail="Mandi data service returned invalid JSON."
        )

    if not data.get("success"):
        raise HTTPException(
            status_code=502,
            detail="Mandi data service did not return a successful response."
        )

    records = data.get("data", [])
    cleaned_records = []

    for record in records[:limit]:
        try:
            min_price = float(record["min_price"])
            max_price = float(record["max_price"])
            modal_price = float(record["modal_price"])
        except (KeyError, TypeError, ValueError):
            min_price = max_price = modal_price = None

        cleaned_records.append({
            "id": record.get("id"),
            "state": record.get("state"),
            "district": record.get("district"),
            "market": record.get("market"),
            "commodity": record.get("commodity"),
            "variety": record.get("variety"),
            "grade": record.get("grade"),
            "arrival_date": record.get("arrival_date"),
            "min_price_quintal": min_price,
            "max_price_quintal": max_price,
            "modal_price_quintal": modal_price,
            "min_price_kg": min_price / 100 if min_price is not None else None,
            "max_price_kg": max_price / 100 if max_price is not None else None,
            "modal_price_kg": modal_price / 100 if modal_price is not None else None,
            "fetched_at": record.get("fetched_at")
        })

    return {
        "success": True,
        "source": "Community Mandi API; underlying records sourced from government mandi data",
        "state": state,
        "commodity": commodity,
        "count": len(cleaned_records),
        "latest_fetched_at": data.get("meta", {}).get("latest_fetched_at"),
        "data_freshness_warning": (
            "Check the fetch timestamp before making selling decisions; "
            "market prices may be delayed."
        ),
        "records": cleaned_records
    }

@app.get("/api/buyers")
def get_buyers():
    buyers_file = Path(__file__).resolve().parent / "buyers.json"

    try:
        with open(buyers_file, "r", encoding="utf-8") as file:
            return json.load(file)
    except FileNotFoundError:
        raise HTTPException(
            status_code=500,
            detail="buyers.json was not found in the backend folder."
        )
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=500,
            detail="buyers.json contains invalid JSON."
        )
