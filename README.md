# 🧮 LLM Token Calculator — 大模型 TOKEN 计算器

选择模型，输入 TOKEN 数量或问题类型，实时计算大模型使用成本。支持人民币/美元/欧元。

---

## 启动方式

### 方式一：双击运行（Windows）

```
双击项目根目录下的 run.bat
```

自动启动服务并打开浏览器。按 `Ctrl+C` 停止。

### 方式二：命令行

```bash
cd backend
pip install -r requirements.txt
python main.py
```

浏览器访问 **http://127.0.0.1:8000**

---

## 页面功能

| 页面 | 说明 |
|------|------|
| 首页 | 选择模型 + 货币切换 + 三个功能入口 |
| 输入 TOKEN | 输入 TOKEN 数 → 显示费用 + 各级别对话次数 |
| 输入预算 | 输入金额 → 显示可买 TOKEN 数 + 对话次数 + 全模型价格表 |
| 输入对话 | 选择对话等级 → 100次估算 + 文本框实时 TOKEN 计算 |

## 管理后台

访问 **http://127.0.0.1:8000/admin**

- 查看/手动修改 13 个模型的实时价格
- 自动抓取日志（每 6 小时自动更新价格）
- 价格历史记录（30天）
- 一键触发价格更新

## API 文档

访问 **http://127.0.0.1:8000/docs** 查看 Swagger 文档

---

## 项目结构

```
llm-token-calculator/
├── run.bat              # Windows 一键启动
├── run.sh               # Mac/Linux 一键启动
├── backend/
│   ├── main.py           # 入口（前端+后端一体化）
│   ├── static/           # 前端构建产物（自动生成）
│   ├── data/             # JSON 数据（模型价格、等级、汇率）
│   ├── routers/          # API 路由
│   └── services/         # 业务逻辑 + 价格抓取
└── frontend/             # React 源码（开发用）
```

---

## 自定义

编辑 `backend/data/models.json` 可添加或修改模型。修改后重启服务生效（或通过 `/admin` 后台在线修改）。

汇率编辑 `backend/data/exchange_rates.json`。
