"""
LLM Token Calculator — FastAPI 入口
"""

import os
import sys
import mimetypes
import webbrowser
import threading
from contextlib import asynccontextmanager
from pathlib import Path

# ── 修复 Windows 上 JS/CSS 的 MIME 类型 ─────
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ── 配置 ────────────────────────────────────
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
if not STATIC_DIR.exists():
    STATIC_DIR = BASE_DIR.parent / "frontend" / "dist"

PORT = int(os.environ.get("PORT", 8000))
HOST = os.environ.get("HOST", "0.0.0.0" if "PORT" in os.environ else "127.0.0.1")


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        from services.price_scheduler import start_scheduler, stop_scheduler
        start_scheduler(interval_hours=6)
        print("[Scheduler] started")
    except Exception as e:
        print(f"[Scheduler] skipped: {e}")
    yield
    try:
        from services.price_scheduler import stop_scheduler
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(title="LLM Token Calculator", version="2.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# ── 核心 API 路由（始终加载） ────────────────
from routers import models, thinking, calculate, rates
app.include_router(models.router)
app.include_router(thinking.router)
app.include_router(calculate.router)
app.include_router(rates.router)

@app.get("/api/health")
def health_check():
    return {"status": "ok", "version": "2.1.0"}

# ── 管理后台（可选加载） ─────────────────────
try:
    from routers import admin
    app.include_router(admin.router)
    print("[Admin] loaded")
except Exception as e:
    print(f"[Admin] skipped: {e}")

# ── 前端静态文件 ────────────────────────────
if STATIC_DIR.exists():
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/")
    async def serve_index():
        """首页"""
        return FileResponse(str(STATIC_DIR / "index.html"))


# ── 本地启动 ────────────────────────────────
def open_browser():
    import time
    time.sleep(1.5)
    webbrowser.open(f"http://{HOST}:{PORT}")

if __name__ == "__main__":
    import uvicorn
    auto_open = "--no-browser" not in sys.argv
    if auto_open:
        threading.Thread(target=open_browser, daemon=True).start()
    print(f"""
+------------------------------------------+
|     LLM TOKEN 计算器  v2.1               |
|     http://{HOST}:{PORT}                  |
|     按 Ctrl+C 停止                       |
+------------------------------------------+
    """)
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False, log_level="info")
