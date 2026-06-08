"""模型数据服务 — 读取和查询 models.json"""

import json
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data"


def _load_models():
    with open(DATA_DIR / "models.json", "r", encoding="utf-8") as f:
        return json.load(f)


def get_all_models(search: Optional[str] = None, provider: Optional[str] = None):
    """获取所有模型，支持搜索和厂商筛选"""
    data = _load_models()
    models = data["models"]

    if search:
        search_lower = search.lower()
        models = [
            m for m in models
            if search_lower in m["name"].lower()
            or search_lower in m["provider"].lower()
            or search_lower in m["id"].lower()
            or search_lower in m.get("description", "").lower()
        ]

    if provider:
        models = [m for m in models if m["provider"] == provider]

    return models


def get_model_by_id(model_id: str):
    """根据 ID 获取单个模型"""
    data = _load_models()
    for m in data["models"]:
        if m["id"] == model_id:
            return m
    return None


def get_providers():
    """获取所有厂商列表"""
    data = _load_models()
    return data["providers"]
