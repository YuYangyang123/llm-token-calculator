"""
价格定时调度器 — 使用 APScheduler 定时执行价格更新
"""

import logging
from datetime import datetime, timezone

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .price_fetcher import run_price_update, _load_fetch_log, _load_history

logger = logging.getLogger("price_scheduler")
scheduler = AsyncIOScheduler()

# 调度器状态
_scheduler_status = {
    "running": False,
    "last_run": None,
    "last_result": None,
    "next_run": None,
}


def get_scheduler_status() -> dict:
    """获取调度器运行状态"""
    jobs = scheduler.get_jobs()
    return {
        "running": _scheduler_status["running"],
        "last_run": _scheduler_status["last_run"],
        "last_result": _scheduler_status["last_result"],
        "next_run": str(jobs[0].next_run_time) if jobs else None,
        "job_count": len(jobs),
    }


def get_fetch_logs(hours: int = 24) -> list:
    """获取最近的抓取日志"""
    logs = _load_fetch_log()
    if hours > 0:
        cutoff = datetime.now(timezone.utc).timestamp() - hours * 3600
        logs = [
            l for l in logs
            if datetime.fromisoformat(l["timestamp"]).timestamp() > cutoff
        ]
    return logs[-100:]  # 最多返回 100 条


def get_price_history(model_id: str = None, days: int = 30) -> list:
    """获取价格历史记录"""
    history = _load_history()
    if model_id:
        history = [h for h in history if h["model_id"] == model_id]
    if days > 0:
        cutoff = datetime.now(timezone.utc).timestamp() - days * 86400
        history = [h for h in history if h.get("timestamp", 0) > cutoff]
    return history[-200:]  # 最多 200 条


async def _price_update_job():
    """定时任务：执行价格更新"""
    logger.info("开始执行定时价格更新...")
    try:
        result = await run_price_update()
        _scheduler_status["last_run"] = datetime.now(timezone.utc).isoformat()
        _scheduler_status["last_result"] = result
        logger.info(f"价格更新完成: {result}")
    except Exception as e:
        logger.error(f"价格更新失败: {e}")
        _scheduler_status["last_run"] = datetime.now(timezone.utc).isoformat()
        _scheduler_status["last_result"] = {"error": str(e)}


def start_scheduler(interval_hours: int = 6):
    """启动定时调度器"""
    if _scheduler_status["running"]:
        return

    scheduler.add_job(
        _price_update_job,
        trigger=IntervalTrigger(hours=interval_hours),
        id="price_update",
        name="模型价格定时更新",
        replace_existing=True,
    )
    scheduler.start()
    _scheduler_status["running"] = True
    logger.info(f"价格调度器已启动，间隔: {interval_hours} 小时")


def stop_scheduler():
    """停止定时调度器"""
    if _scheduler_status["running"]:
        scheduler.shutdown(wait=False)
        _scheduler_status["running"] = False
        logger.info("价格调度器已停止")
