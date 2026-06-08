"""价格计算 API 路由"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.model_service import get_model_by_id
from services.calculator import calculate_cost

router = APIRouter(prefix="/api", tags=["calculate"])


class CalculateRequest(BaseModel):
    model_id: str = Field(..., description="模型 ID", examples=["gpt-4o"])
    token_count: int = Field(..., ge=1, le=10_000_000, description="输入的 TOKEN 数量", examples=[10000])
    currency: str = Field(default="USD", description="货币代码", examples=["USD", "CNY", "EUR"])
    output_ratio: float = Field(default=0.7, ge=0.0, le=3.0, description="输出TOKEN占输入的比例，默认0.7")


@router.post("/calculate")
def calculate_token_cost(req: CalculateRequest):
    """计算 TOKEN 使用费用"""
    # 验证模型存在
    model = get_model_by_id(req.model_id)
    if not model:
        raise HTTPException(status_code=404, detail=f"模型 '{req.model_id}' 未找到")

    # 验证货币
    valid_currencies = ["USD", "CNY", "EUR"]
    if req.currency not in valid_currencies:
        raise HTTPException(
            status_code=400,
            detail=f"不支持的货币 '{req.currency}'，支持的货币: {', '.join(valid_currencies)}"
        )

    result = calculate_cost(
        model=model,
        token_count=req.token_count,
        currency=req.currency,
        output_ratio=req.output_ratio
    )

    return result
