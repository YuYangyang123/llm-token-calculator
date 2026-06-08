#!/bin/bash
cd "$(dirname "$0")/backend"
echo ""
echo "  正在启动大模型 TOKEN 计算器..."
echo ""
python main.py
