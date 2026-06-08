"""
管理后台路由 — 模型价格管理 / 抓取日志 / 手动触发更新
"""

import json
from pathlib import Path
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import HTMLResponse
from pydantic import BaseModel, Field

from services.model_service import get_all_models, get_model_by_id
from services.price_scheduler import (
    get_scheduler_status, get_fetch_logs, get_price_history,
    start_scheduler,
)
from services.price_fetcher import run_price_update, _load_models, _save_models

router = APIRouter(prefix="/admin", tags=["admin"])
DATA_DIR = Path(__file__).parent.parent / "data"


# ── 管理后台页面 (纯 HTML) ─────────────────────

ADMIN_HTML = r"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Token 计算器 — 管理后台</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'PingFang SC','Microsoft YaHei',sans-serif;background:#f1f5f9;color:#1e293b;padding:20px}
h1{font-size:1.4rem;margin-bottom:4px}
h2{font-size:1.05rem;margin-bottom:10px}
.container{max-width:900px;margin:0 auto}
.card{background:#fff;border-radius:12px;padding:20px;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,.08)}
.row{display:flex;gap:12px;flex-wrap:wrap}
.col{flex:1;min-width:200px}
.stat{text-align:center;padding:12px;background:#f8fafc;border-radius:8px}
.stat-val{font-size:1.5rem;font-weight:800;color:#6366f1}
.stat-lbl{font-size:.75rem;color:#64748b;margin-top:2px}
table{width:100%;border-collapse:collapse;font-size:.82rem}
th,td{padding:8px 10px;text-align:left;border-bottom:1px solid #e2e8f0}
th{background:#f8fafc;font-weight:600;color:#64748b;font-size:.75rem}
tr:hover{background:#f8fafc}
.prices-input{width:80px;padding:4px 6px;border:1px solid #e2e8f0;border-radius:4px;font-size:.8rem;text-align:center}
.prices-input:focus{border-color:#6366f1;outline:none}
.btn{padding:8px 16px;border:none;border-radius:8px;font-size:.82rem;cursor:pointer;font-family:inherit;transition:.2s}
.btn-primary{background:#6366f1;color:#fff}
.btn-primary:hover{background:#4f46e5}
.btn-danger{background:#ef4444;color:#fff}
.btn-danger:hover{background:#dc2626}
.btn-sm{padding:4px 10px;font-size:.72rem}
.badge{padding:2px 8px;border-radius:10px;font-size:.7rem;font-weight:600}
.badge-ok{background:#dcfce7;color:#15803d}
.badge-warn{background:#fef3c7;color:#92400e}
.badge-err{background:#fee2e2;color:#dc2626}
.log-list{max-height:300px;overflow-y:auto;font-size:.78rem}
.log-item{padding:6px 0;border-bottom:1px solid #f1f5f9;display:flex;gap:8px}
.log-time{color:#94a3b8;white-space:nowrap;font-size:.72rem}
.log-source{font-weight:600;min-width:80px}
.msg{font-size:.78rem;padding:8px;border-radius:6px;margin-top:8px;display:none}
.msg-ok{background:#dcfce7;color:#15803d;display:block}
.msg-err{background:#fee2e2;color:#dc2626;display:block}
.tabs{display:flex;gap:8px;margin-bottom:14px}
.tab{padding:6px 14px;border:1px solid #e2e8f0;border-radius:20px;font-size:.78rem;cursor:pointer;background:#fff}
.tab.active{background:#6366f1;color:#fff;border-color:#6366f1}
</style>
</head>
<body>
<div class="container">
<h1>🧮 Token 计算器 — 管理后台</h1>
<p style="color:#64748b;font-size:.8rem;margin-bottom:16px">模型价格管理 · 抓取日志 · 手动更新</p>

<div class="row" id="stats"></div>

<div class="card">
<div class="tabs"><button class="tab active" onclick="switchTab('prices')">价格管理</button><button class="tab" onclick="switchTab('logs')">抓取日志</button><button class="tab" onclick="switchTab('history')">价格历史</button></div>
<div id="tab-prices">
<h2>📋 模型价格 <button class="btn btn-primary btn-sm" style="margin-left:12px" onclick="saveAll()">💾 全部保存</button> <button class="btn btn-sm" style="background:#f59e0b;color:#fff" onclick="forceUpdate()">🔄 立即抓取</button></h2>
<div id="modelTable"></div>
<div id="msg"></div>
</div>
<div id="tab-logs" style="display:none"><h2>📜 抓取日志</h2><div class="log-list" id="logList"></div></div>
<div id="tab-history" style="display:none"><h2>📈 价格历史</h2><select id="historyModel" onchange="loadHistory()" style="margin-bottom:10px;padding:6px;border-radius:6px;border:1px solid #e2e8f0"></select><div id="historyList"></div></div>
</div>
</div>
<script>
let models=[],currentTab='prices';
async function api(url,opts={}){
const r=await fetch(url,{headers:{'Content-Type':'application/json'},...opts});
return r.json();
}
function switchTab(t){currentTab=t;document.querySelectorAll('.tab').forEach((b,i)=>b.classList.toggle('active',i==['prices','logs','history'].indexOf(t)));document.querySelectorAll('[id^="tab-"]').forEach(d=>d.style.display='none');document.getElementById('tab-'+t).style.display='';if(t=='logs')loadLogs();if(t=='history')loadHistory();}
async function loadAll(){
const[stats,mRes,sRes]=await Promise.all([api('/admin/api/stats'),api('/api/models'),api('/admin/api/scheduler')]);
models=mRes.models;
document.getElementById('stats').innerHTML='<div class="col"><div class="stat"><div class="stat-val">'+models.length+'</div><div class="stat-lbl">模型总数</div></div></div><div class="col"><div class="stat"><div class="stat-val">'+stats.total_logs+'</div><div class="stat-lbl">抓取日志</div></div></div><div class="col"><div class="stat"><div class="stat-val">'+(sRes.running?'运行中':'已停止')+'</div><div class="stat-lbl">调度器</div></div></div>';
let h='<table><tr><th>厂商</th><th>模型</th><th>输入价格/1M</th><th>输出价格/1M</th><th>操作</th></tr>';
models.forEach(m=>{h+='<tr><td>'+m.provider+'</td><td><strong>'+m.name+'</strong></td><td>$<input class="prices-input" id="inp-'+m.id+'" value="'+m.input_price_per_1m_tokens+'"></td><td>$<input class="prices-input" id="out-'+m.id+'" value="'+m.output_price_per_1m_tokens+'"></td><td><button class="btn btn-primary btn-sm" onclick="saveOne(\''+m.id+'\')">保存</button></td></tr>';});
h+='</table>';document.getElementById('modelTable').innerHTML=h;
const sel=document.getElementById('historyModel');sel.innerHTML='<option value="">全部模型</option>'+models.map(m=>'<option value="'+m.id+'">'+m.provider+' '+m.name+'</option>').join('');
}
async function saveOne(id){
const inp=parseFloat(document.getElementById('inp-'+id).value);
const out=parseFloat(document.getElementById('out-'+id).value);
if(isNaN(inp)||isNaN(out))return showMsg('请输入有效数字','err');
const r=await api('/admin/api/models/'+id,{method:'PUT',body:JSON.stringify({input_price_per_1m_tokens:inp,output_price_per_1m_tokens:out})});
showMsg(r.detail||'保存成功',r.detail?'err':'ok');
}
async function saveAll(){
for(const m of models)await saveOne(m.id);
}
async function forceUpdate(){
document.querySelector('#msg').className='msg';document.getElementById('msg').textContent='正在抓取...';document.getElementById('msg').style.display='block';
const r=await api('/admin/api/force-update',{method:'POST'});
showMsg('更新完成: '+JSON.stringify(r),r.error?'err':'ok');
loadAll();
}
async function loadLogs(){
const logs=await api('/admin/api/logs?hours=72');
let h='';logs.forEach(l=>{const badge={'success':'badge-ok','warning':'badge-warn','error':'badge-err'}[l.status]||'';h+='<div class="log-item"><span class="log-time">'+l.timestamp.substring(0,19)+'</span><span class="log-source">'+l.source+'</span><span class="badge '+badge+'">'+l.status+'</span><span>'+l.message+'</span></div>';});
document.getElementById('logList').innerHTML=h||'<p style="color:#94a3b8">暂无日志</p>';
}
async function loadHistory(){
const mid=document.getElementById('historyModel').value;
const h=await api('/admin/api/history?days=30'+(mid?'&model_id='+mid:''));
let html='<table><tr><th>时间</th><th>模型</th><th>输入/1M</th><th>输出/1M</th></tr>';
h.forEach(e=>{html+='<tr><td>'+e.date+'</td><td>'+e.model_id+'</td><td>$'+e.input_price_per_1m_tokens+'</td><td>$'+e.output_price_per_1m_tokens+'</td></tr>';});
document.getElementById('historyList').innerHTML=html||'<p style="color:#94a3b8">暂无历史</p>';
}
function showMsg(msg,type){const d=document.getElementById('msg');d.textContent=msg;d.className='msg msg-'+type;setTimeout(()=>d.className='msg',3000);}
loadAll();
</script>
</body>
</html>"""


@router.get("", response_class=HTMLResponse)
@router.get("/", response_class=HTMLResponse)
async def admin_page():
    """管理后台首页"""
    return HTMLResponse(content=ADMIN_HTML)


# ── 管理 API ───────────────────────────────────

class PriceUpdateRequest(BaseModel):
    input_price_per_1m_tokens: float = Field(..., ge=0, description="输入价格 (USD/1M tokens)")
    output_price_per_1m_tokens: float = Field(..., ge=0, description="输出价格 (USD/1M tokens)")


@router.get("/api/stats")
async def admin_stats():
    """获取管理后台统计"""
    from services.price_fetcher import _load_fetch_log
    logs = _load_fetch_log()
    return {"total_logs": len(logs), "total_models": len(get_all_models())}


@router.get("/api/scheduler")
async def scheduler_status():
    """获取调度器状态"""
    return get_scheduler_status()


@router.put("/api/models/{model_id}")
async def update_model_price(model_id: str, req: PriceUpdateRequest):
    """手动更新模型价格"""
    models_data = _load_models()
    for m in models_data["models"]:
        if m["id"] == model_id:
            old_in = m["input_price_per_1m_tokens"]
            old_out = m["output_price_per_1m_tokens"]
            m["input_price_per_1m_tokens"] = req.input_price_per_1m_tokens
            m["output_price_per_1m_tokens"] = req.output_price_per_1m_tokens
            models_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            _save_models(models_data)

            # 记录历史
            from services.price_fetcher import _record_history
            _record_history(model_id, req.input_price_per_1m_tokens, req.output_price_per_1m_tokens)
            return {
                "detail": f"模型 {model_id} 已更新: ${old_in}→${req.input_price_per_1m_tokens} / ${old_out}→${req.output_price_per_1m_tokens}"
            }
    raise HTTPException(status_code=404, detail=f"模型 {model_id} 未找到")


@router.post("/api/force-update")
async def force_price_update():
    """手动触发价格更新"""
    try:
        result = await run_price_update()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"更新失败: {e}")


@router.get("/api/logs")
async def fetch_logs(hours: int = Query(default=24, ge=1, le=720)):
    """获取抓取日志"""
    return get_fetch_logs(hours=hours)


@router.get("/api/history")
async def price_history(
    model_id: str = Query(default=None),
    days: int = Query(default=30, ge=1, le=365),
):
    """获取价格历史"""
    return get_price_history(model_id=model_id, days=days)
