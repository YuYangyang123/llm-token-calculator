"""思考量分级 API 路由"""

from fastapi import APIRouter
from services.calculator import get_thinking_levels

router = APIRouter(prefix="/api", tags=["thinking"])


@router.get("/thinking-levels")
def list_thinking_levels():
    """获取思考量六级分类及问题预设"""
    return get_thinking_levels()
