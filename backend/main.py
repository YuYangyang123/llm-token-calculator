"""
LLM Token Calculator — 独立可运行版本
启动后自动在浏览器打开，前端 + 后端一体化
用法：python main.py  或  双击 run.bat
"""

import os
import sys
import mimetypes
import webbrowser
import threading
from contextlib import asynccontextmanager
from pathlib import Path

# ── 修复 Windows 上 JS/CSS 的 MIME 类型 ─────
# Python 在 Windows 上会把 .js / .mjs / .css 识别为 text/plain，
# 导致浏览器拒绝加载 ES Module。此处强制注册正确 MIME。
mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("text/css", ".css")
mimetypes.add_type("image/svg+xml", ".svg")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import models, thinking, calculate, rates, admin

# ── 确定静态文件目录 ──────────────────────────
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
# 如果 static 不存在（首次运行），尝试使用前端开发服务器路径
if not STATIC_DIR.exists():
    STATIC_DIR = BASE_DIR.parent / "frontend" / "dist"

PORT = int(os.environ.get("PORT", 8000))
# 云部署时 PORT 由平台注入，此时应监听 0.0.0.0；本地默认 127.0.0.1
HOST = os.environ.get("HOST", "0.0.0.0" if "PORT" in os.environ else "127.0.0.1")


# ── 应用生命周期 ──────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用启动/关闭时的操作"""
    # 启动时：启动价格抓取调度器
    from services.price_scheduler import start_scheduler, stop_scheduler
    start_scheduler(interval_hours=6)
    print(f"[Scheduler] 价格更新调度器已启动 (间隔: 6h)")
    yield
    # 关闭时：停止调度器
    stop_scheduler()
    print("[Scheduler] 价格更新调度器已停止")


app = FastAPI(
    title="LLM Token Calculator",
    description="大模型 TOKEN 计算器",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API 路由 ──────────────────────────────────
app.include_router(models.router)
app.include_router(thinking.router)
app.include_router(calculate.router)
app.include_router(rates.router)
app.include_router(admin.router)


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "LLM Token Calculator",
        "version": "2.0.0",
    }


# ── 前端静态文件（生产模式） ─────────────────

if STATIC_DIR.exists():
    # 挂载静态资源（JS/CSS/图片等）
    assets_dir = STATIC_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str = ""):
        """所有非 API 路径回退到 index.html"""
        file_path = STATIC_DIR / full_path
        if full_path and file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(STATIC_DIR / "index.html"))


# ── 启动逻辑 ──────────────────────────────────

def open_browser():
    """延迟打开浏览器"""
    import time
    time.sleep(1.5)
    url = f"http://{HOST}:{PORT}"
    print(f"\n  打开浏览器: {url}\n")
    webbrowser.open(url)


if __name__ == "__main__":
    import uvicorn

    auto_open = "--no-browser" not in sys.argv

    if auto_open:
        threading.Thread(target=open_browser, daemon=True).start()

    banner = """
+------------------------------------------+
|     LLM TOKEN 计算器  v2.0               |
|                                          |
|  本地访问: http://{host}:{port:<5}        |
|  管理后台: http://{host}:{port:<5}/admin  |
|  API 文档: http://{host}:{port:<5}/docs   |
|                                          |
|  按 Ctrl+C 停止服务                      |
+------------------------------------------+
    """.format(host=HOST, port=PORT)
    print(banner)

    uvicorn.run(
        "main:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )
