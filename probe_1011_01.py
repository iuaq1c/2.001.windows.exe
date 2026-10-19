#!/usr/bin/env python3
"""Перечисление маршрутов локального сервиса Greenbank (2_1011_01-windows.exe).

Сервис нужно запустить отдельно, скрипт только опрашивает его по HTTP.

Запуск:
    python probe_1011_01.py http://127.0.0.1:53240
"""

import json
import sys
import urllib.error
import urllib.request

BASE = sys.argv[1].rstrip("/") if len(sys.argv) > 1 else "http://127.0.0.1:53240"

ROUTES = [
    ("GET", "/", None),
    ("GET", "/api/state", None),
    ("GET", "/api/auth/stats", None),
    ("GET", "/api/auth/cards", None),
    ("POST", "/api/auth/login", {"username": "useruser", "password": "x"}),
    ("POST", "/api/auth/change-password/request-code", {"username": "useruser"}),
]


def call(method, path, body=None):
    """Возвращает (status, content_type, payload). status=None — нет соединения."""
    url = BASE + path
    headers = {"Accept": "application/json"}
    data = None
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"

    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=5) as response:
            return response.status, response.headers.get("Content-Type", ""), response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.headers.get("Content-Type", ""), error.read()
    except urllib.error.URLError as error:
        return None, "", str(error.reason).encode("utf-8", "replace")


def shorten(payload, limit=400):
    try:
        return payload.decode("utf-8")[:limit]
    except UnicodeDecodeError:
        return payload[:limit].hex()


def classify(content_type, payload):
    """Отличаем реальный ответ API от SPA-заглушки."""
    if content_type.startswith("text/html"):
        return "SPA fallback (маршрута нет)"
    if content_type.startswith("application/json"):
        try:
            json.loads(payload.decode("utf-8"))
            return "JSON API"
        except (ValueError, UnicodeDecodeError):
            return "заявлен JSON, но тело не разбирается"
    return f"другой тип: {content_type or 'нет'}"


def main():
    print(f"target: {BASE}\n")
    for method, path, body in ROUTES:
        status, content_type, payload = call(method, path, body)
        if status is None:
            print(f"{method:5} {path:45} -> нет соединения: {shorten(payload, 120)}")
            continue
        print(f"{method:5} {path:45} -> {status} {content_type or '—'}")
        print(f"      вердикт: {classify(content_type, payload)}")
        text = shorten(payload).strip()
        if text:
            print("      " + text.replace("\n", "\n      "))
        print()


if __name__ == "__main__":
    main()
