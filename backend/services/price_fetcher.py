"""
价格抓取服务 — 从各厂商官方渠道获取最新模型定价

策略：
- 优先官方 API（稳定可靠）
- 次选网页抓取（需维护 CSS 选择器）
- 兜底：抓取失败保留上次价格，记录日志
"""

import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional

import httpx
from bs4 import BeautifulSoup

logger = logging.getLogger("price_fetcher")
DATA_DIR = Path(__file__).parent.parent / "data"
MODELS_FILE = DATA_DIR / "models.json"
HISTORY_FILE = DATA_DIR / "price_history.json"
FETCH_LOG_FILE = DATA_DIR / "fetch_log.json"

# ── 工具函数 ────────────────────────────────────

def _load_models() -> dict:
    with open(MODELS_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_models(data: dict):
    with open(MODELS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def _load_history() -> list:
    if not HISTORY_FILE.exists():
        return []
    with open(HISTORY_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_history(entries: list):
    # 只保留最近 180 天
    cutoff = datetime.now(timezone.utc).timestamp() - 180 * 86400
    entries = [e for e in entries if e.get("timestamp", 0) > cutoff]
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

def _load_fetch_log() -> list:
    if not FETCH_LOG_FILE.exists():
        return []
    with open(FETCH_LOG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def _save_fetch_log(entries: list):
    # 只保留最近 500 条
    entries = entries[-500:]
    with open(FETCH_LOG_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)

def _log_fetch(source: str, status: str, message: str = "", detail: dict = None):
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "source": source,
        "status": status,  # success / warning / error
        "message": message,
        "detail": detail or {},
    }
    logs = _load_fetch_log()
    logs.append(entry)
    _save_fetch_log(logs)
    level = {"success": "info", "warning": "warning", "error": "error"}.get(status, "info")
    getattr(logger, level)(f"[{source}] {message}")

def _record_history(model_id: str, input_price: float, output_price: float):
    history = _load_history()
    history.append({
        "timestamp": datetime.now(timezone.utc).timestamp(),
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M"),
        "model_id": model_id,
        "input_price_per_1m_tokens": input_price,
        "output_price_per_1m_tokens": output_price,
    })
    _save_history(history)


# ── 各厂商抓取器 ─────────────────────────────────

async def fetch_openai(client: httpx.AsyncClient) -> dict:
    """
    OpenAI 定价 — 从网页抓取（官网未提供结构化 API）
    URL: https://platform.openai.com/docs/guides/chat-completions
    当前使用备用方案：抓取 community 维护的定价摘要
    """
    results = {}
    try:
        # OpenAI 无独立 pricing API，抓取文档页面
        url = "https://openai.com/api/pricing/"
        resp = await client.get(url, timeout=15, follow_redirects=True)
        if resp.status_code != 200:
            _log_fetch("OpenAI", "error", f"HTTP {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, "html.parser")
        # 价格数据通常在 script 标签的 JSON 中或表格中
        # 由于页面结构多变，这里做 best-effort 解析
        # 抓取包含 "gpt-4o" 文字附近的价格数字
        body_text = soup.get_text()

        # 简单策略：如果页面包含价格相关信息则解析
        # 实际价格匹配很脆弱，此处搭建框架，具体选择器需按页面结构调整
        # 目前返回空，由 fallback 保持现有价格
        _log_fetch("OpenAI", "warning", "网页抓取需维护选择器，本次跳过", {"url": url})
    except Exception as e:
        _log_fetch("OpenAI", "error", str(e))
    return results


async def fetch_anthropic(client: httpx.AsyncClient) -> dict:
    """
    Anthropic 定价页
    URL: https://www.anthropic.com/pricing
    """
    results = {}
    try:
        url = "https://www.anthropic.com/pricing"
        resp = await client.get(url, timeout=15, follow_redirects=True)
        if resp.status_code != 200:
            _log_fetch("Anthropic", "error", f"HTTP {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, "html.parser")
        _log_fetch("Anthropic", "warning", "网页抓取框架就绪，选择器需按实际页面维护")
    except Exception as e:
        _log_fetch("Anthropic", "error", str(e))
    return results


async def fetch_google(client: httpx.AsyncClient) -> dict:
    """
    Google Gemini 定价
    URL: https://ai.google.dev/pricing
    """
    results = {}
    try:
        url = "https://ai.google.dev/pricing"
        resp = await client.get(url, timeout=15, follow_redirects=True)
        if resp.status_code != 200:
            _log_fetch("Google", "error", f"HTTP {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, "html.parser")
        _log_fetch("Google", "warning", "网页抓取框架就绪，选择器需按实际页面维护")
    except Exception as e:
        _log_fetch("Google", "error", str(e))
    return results


async def fetch_deepseek(client: httpx.AsyncClient) -> dict:
    """
    DeepSeek 定价 — 从官方 API / 文档页面获取
    URL: https://api-docs.deepseek.com/quick_start/pricing
    """
    results = {}
    try:
        url = "https://api-docs.deepseek.com/quick_start/pricing"
        resp = await client.get(url, timeout=15, follow_redirects=True)
        if resp.status_code != 200:
            _log_fetch("DeepSeek", "error", f"HTTP {resp.status_code}")
            return results

        soup = BeautifulSoup(resp.text, "html.parser")
        _log_fetch("DeepSeek", "warning", "网页抓取框架就绪，选择器需按实际页面维护")
    except Exception as e:
        _log_fetch("DeepSeek", "error", str(e))
    return results


# ── 主抓取流程 ───────────────────────────────────

async def fetch_all_prices() -> dict:
    """
    抓取所有厂商价格，返回需要更新的模型数据
    失败时返回空 dict（不更新，保留现有价格）
    """
    all_updates = {}
    headers = {
        "User-Agent": "LLM-Token-Calculator/1.0 (Price Fetcher; contact@example.com)"
    }

    async with httpx.AsyncClient(headers=headers) as client:
        fetchers = [
            ("OpenAI", fetch_openai),
            ("Anthropic", fetch_anthropic),
            ("Google", fetch_google),
            ("DeepSeek", fetch_deepseek),
        ]

        for name, fetcher in fetchers:
            try:
                updates = await fetcher(client)
                all_updates.update(updates)
            except Exception as e:
                _log_fetch(name, "error", f"抓取异常: {e}")

    return all_updates


def apply_price_updates(updates: dict) -> int:
    """
    将抓取的价格更新写入 models.json 和 price_history.json
    返回更新的模型数量
    """
    if not updates:
        _log_fetch("System", "warning", "无价格更新，保留现有价格")
        return 0

    data = _load_models()
    updated_count = 0

    for model in data["models"]:
        model_id = model["id"]
        if model_id in updates:
            new_prices = updates[model_id]
            old_input = model["input_price_per_1m_tokens"]
            old_output = model["output_price_per_1m_tokens"]
            new_input = new_prices.get("input", old_input)
            new_output = new_prices.get("output", old_output)

            # 检查异常波动（>50%）
            for price_type, old_val, new_val in [
                ("input", old_input, new_input),
                ("output", old_output, new_output),
            ]:
                if old_val > 0 and abs(new_val - old_val) / old_val > 0.5:
                    _log_fetch(
                        model_id, "warning",
                        f"{price_type} 价格波动 >50%: ${old_val} → ${new_val}",
                    )

            model["input_price_per_1m_tokens"] = new_input
            model["output_price_per_1m_tokens"] = new_output
            _record_history(model_id, new_input, new_output)
            updated_count += 1

    if updated_count > 0:
        data["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_models(data)
        _log_fetch("System", "success", f"成功更新 {updated_count} 个模型价格")

    return updated_count


async def run_price_update() -> dict:
    """执行一次完整的价格更新流程"""
    updates = await fetch_all_prices()
    count = apply_price_updates(updates)
    return {
        "updates_found": len(updates),
        "models_updated": count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
