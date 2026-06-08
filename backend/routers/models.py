"""模型相关 API 路由"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from services.model_service import get_all_models, get_model_by_id, get_providers

router = APIRouter(prefix="/api", tags=["models"])
DATA_DIR = Path(__file__).parent.parent / "data"


def _get_updated_at():
    """读取 models.json 的最后更新时间"""
    try:
        with open(DATA_DIR / "models.json", "r", encoding="utf-8") as f:
            data = json.load(f)
        return data.get("updated_at")
    except Exception:
        return None


@router.get("/models")
def list_models(
    search: Optional[str] = Query(None, description="搜索关键词（模型名/厂商/描述）"),
    provider: Optional[str] = Query(None, description="按厂商筛选")
):
    """获取模型列表，支持搜索和厂商筛选"""
    models = get_all_models(search=search, provider=provider)
    return {
        "total": len(models),
        "models": models,
        "updated_at": _get_updated_at(),
    }


@router.get("/models/{model_id}")
def get_model(model_id: str):
    """根据 ID 获取模型详情"""
    model = get_model_by_id(model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 '{model_id}' 未找到")
    return model


@router.get("/providers")
def list_providers():
    """获取所有厂商列表"""
    return {"providers": get_providers()}
