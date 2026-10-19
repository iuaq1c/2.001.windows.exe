# 2.001.windows.exe

![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![C++](https://img.shields.io/badge/C%2B%2B-00599C?style=flat&logo=cplusplus&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![PowerShell](https://img.shields.io/badge/PowerShell-5391FE?style=flat&logo=powershell&logoColor=white)
![Windows PE](https://img.shields.io/badge/PE-x86--64-0078D4?style=flat&logo=windows&logoColor=white)
![CTF](https://img.shields.io/badge/CTF-vsosh-8A2BE2?style=flat&logo=hackthebox&logoColor=white)

🐍 Python · 🟨 JavaScript · ➕➕ C++ · 🦀 Rust · 🐚 PowerShell · 🪟 Windows PE · 🚩 CTF

Материалы разбора CTF-задачи «Greenbank» (веб + статический анализ PE).

- [`2_1011_01_writeup.md`](2_1011_01_writeup.md) — полный разбор: артефакт → PE → рантайм → модель данных → динамика → уязвимость → эксплуатация → починка → сверка фактов.
- [`probe_1011_01.py`](probe_1011_01.py) — воспроизведение: опрашивает маршруты локального сервиса и отличает `text/html` fallback от настоящего ответа API.

Бинарник в репозитории не хранится: для идентификации сэмпла достаточно хешей из разбора.

```powershell
# сервис запускается отдельно, скрипт только опрашивает его
python probe_1011_01.py http://127.0.0.1:53240
```

## Скриншоты разбора

### 1. Перебор маршрутов и разбор `app.js`

![Перебор маршрутов и разбор app.js](docs/img/01-routes-and-appjs.png)

### 2. Начало `app.js`: константы, сервисы, `bankStats`

![Начало app.js](docs/img/02-appjs-head.png)

### 3. `/api/auth/stats` и `/api/auth/cards` без авторизации — флаг в имени карты

![Данные без авторизации](docs/img/03-unauth-stats-cards.png)

### 4. `/api/state` отдаёт SPA-заглушку (`text/html`), маршрута на бэкенде нет

![SPA fallback](docs/img/04-spa-fallback.png)

### 5. Прослушиваемые порты: сервис на `127.0.0.1:53240`

![Порты](docs/img/05-listening-ports.png)

### 6. Извлечение строк из PE (`dump.ps1`, 51 434 строки)

![Дамп строк](docs/img/06-strings-dump.png)

### 7. Отфильтрованные строки: структуры serde, маршруты, ошибки крейтов

![Фильтр строк](docs/img/07-strings-filtered.png)

### 8. Соседняя задача: скрытый файл в локальных заголовках ZIP

![ZIP local header](docs/img/08-zip-local-header.png)

## Вывод

- Бинарник `2_1011_01-windows.exe` — не «банк с ассетами», а локальный HTTP-сервис на Rust (axum + hyper + serde), слушающий `127.0.0.1:53240`.
- Упаковки и протекторов нет: энтропия `.text` 6.31, `.data` 1.60 — анализ статикой даёт полную картину.
- Ключевая уязвимость — **CWE-306**: маршруты `/api/auth/stats` и `/api/auth/cards` отдают персональные данные и карты без какой-либо аутентификации. Префикс `/api/auth/` создаёт ложное ощущение защиты.
- «Авторизация» во фронтенде — флаг в `sessionStorage`; серверной сессии нет, клиент сам решает, показывать ли экраны.
- Отличать реальный API от SPA-заглушки обязательно: `text/html` в ответе на `/api/…` означает, что маршрута на бэкенде нет.
- Флаг `vsosh{n3tw0rk_1nt3r4ct10n}` получен обычным `GET` без заголовков — вектор ровно тот, что зашит в названии: взаимодействие с сетью напрямую, минуя интерфейс.
- В соседней задаче с pcap тот же принцип: данные лежат не в «видимой» части (пиксели JPEG), а в метаданных EXIF, склеенных из трёх Base64-фрагментов.
- Починка: серверная проверка сессии на всех `/api/auth/*` кроме `login` и `request-code`, `HttpOnly`+`Secure` cookie или подписанный Bearer-токен, лимит попыток входа, алерты на `200` по защищённому маршруту без субъекта. Bind на loopback — не замена авторизации.
