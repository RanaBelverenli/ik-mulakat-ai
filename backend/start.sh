#!/bin/bash
# Render için startup script
# WebSocket desteği için uvicorn ayarları

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port ${PORT:-10000} \
    --workers 1 \
    --log-level info \
    --timeout-keep-alive 65

