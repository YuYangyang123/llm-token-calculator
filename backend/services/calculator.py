"""价格计算核心逻辑"""

import json
from pathlib import Path
from typing import Optional

DATA_DIR = Path(__file__).parent.parent / "data"


def _load_rates():
    with open(DATA_DIR / "exchange_rates.json", "r", encoding="utf-8") as f:
        return json.load(f)


def _load_thinking_levels():
    with open(DATA_DIR / "thinking_levels.json", "r", encoding="utf-8") as f:
        return json.load(f)


def get_exchange_rates():
    """获取汇率数据"""
    return _load_rates()


def get_thinking_levels():
    """获取思考量分级数据"""
    return _load_thinking_levels()


def calculate_cost(
    model: dict,
    token_count: int,
    currency: str = "USD",
    output_ratio: float = 0.7
) -> dict:
    """
    计算使用成本

    Args:
        model: 模型信息字典
        token_count: 输入的 TOKEN 数量
        currency: 货币代码 (USD, CNY, EUR)
        output_ratio: 输出TOKEN占输入TOKEN的比例，默认70%

    Returns:
        dict: 详细的费用计算结果
    """
    rates = _load_rates()

    # 获取汇率
    rate = rates["rates"].get(currency, 1.0)
    symbol = rates["symbols"].get(currency, "$")

    # 计算输出 TOKEN 数（默认按输入70%）
    output_tokens = int(token_count * output_ratio)

    # 计算费用（价格以每百万TOKEN计）
    input_price_per_token = model["input_price_per_1m_tokens"] / 1_000_000
    output_price_per_token = model["output_price_per_1m_tokens"] / 1_000_000

    input_cost_usd = token_count * input_price_per_token
    output_cost_usd = output_tokens * output_price_per_token
    total_cost_usd = input_cost_usd + output_cost_usd

    # 转换为目标货币
    input_cost = round(input_cost_usd * rate, 4)
    output_cost = round(output_cost_usd * rate, 4)
    total_cost = round(total_cost_usd * rate, 4)

    return {
        "model_id": model["id"],
        "model_name": model["name"],
        "provider": model["provider"],
        "input_tokens": token_count,
        "output_tokens": output_tokens,
        "output_ratio": output_ratio,
        "total_tokens": token_count + output_tokens,
        "currency": currency,
        "symbol": symbol,
        "rate": rate,
        "estimated_input_cost": input_cost,
        "estimated_output_cost": output_cost,
        "estimated_total_cost": total_cost,
        "breakdown": {
            "input": {
                "tokens": token_count,
                "price_per_1m": round(model["input_price_per_1m_tokens"] * rate, 2),
                "cost": input_cost
            },
            "output": {
                "tokens": output_tokens,
                "price_per_1m": round(model["output_price_per_1m_tokens"] * rate, 2),
                "cost": output_cost
            },
            "exchange_rate": rate,
            "base_currency": "USD"
        }
    }
