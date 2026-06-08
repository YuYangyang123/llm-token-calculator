# -*- mode: python ; coding: utf-8 -*-

"""
PyInstaller 打包配置
将整个项目打包为单个 EXE 文件
"""

import sys
from pathlib import Path

block_cipher = None

# 项目根目录
BASE_DIR = Path(__file__).parent
STATIC_DIR = BASE_DIR / "static"
DATA_DIR = BASE_DIR / "data"

# 收集所有需要打包的数据文件
datas = []

# 静态文件（前端构建产物）
if STATIC_DIR.exists():
    for f in STATIC_DIR.rglob("*"):
        if f.is_file():
            dest_dir = str(f.parent.relative_to(BASE_DIR))
            datas.append((str(f), dest_dir))

# JSON 数据文件
if DATA_DIR.exists():
    for f in DATA_DIR.glob("*.json"):
        datas.append((str(f), str(f.parent.relative_to(BASE_DIR))))

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops.auto',
        'uvicorn.protocols.http.auto',
        'fastapi',
        'starlette',
        'httpx',
        'bs4',
        'apscheduler',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='LLM-Token-Calculator',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,          # 显示控制台窗口
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)
