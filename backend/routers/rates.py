"""汇率 API 路由"""

from fastapi import APIRouter
from services.calculator import get_exchange_rates

router = APIRouter(prefix="/api", tags=["rates"])


@router.get("/exchange-rates")
def list_exchange_rates():
    """获取当前汇率数据"""
    return get_exchange_rates()
