import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.map import router as map_router
from app.routes.land import router as land_router
from app.routes.analytics import router as analytics_router
from app.routes.trends import router as trends_router

app = FastAPI()

def env_list(name: str) -> list[str]:
    return [value.strip() for value in os.getenv(name, "").split(",") if value.strip()]


allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://maatitrace.in",
    "https://www.maatitrace.in",
    *env_list("FRONTEND_URL"),
    *env_list("FRONTEND_URLS"),
]
allowed_origins = [origin for origin in allowed_origins if origin]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(map_router)
app.include_router(land_router)
app.include_router(analytics_router)
app.include_router(trends_router)


@app.get("/")
def home():
    return {"message": "BhoomiAI Backend Running"}
