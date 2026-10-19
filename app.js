const app = document.getElementById("app");

const APP_TITLE = "Greenbank";
const AUTH_KEY = "greenbank-authenticated";
let passwordResetCode = null;

const services = [
  {
    title: "Перевод по номеру карты",
    text: "Быстрый платеж между счетами Greenbank и в сторонние банки.",
    icon: "⇄",
  },
  {
    title: "Оплата услуг",
    text: "Коммунальные, мобильная связь, штрафы и регулярные шаблоны.",
    icon: "◫",
  },
  {
    title: "Инвестиционный перевод",
    text: "Покупка фондов, округление трат и откладывание на цели.",
    icon: "↗",
  },
];

let bankCards = [];
let bankStats = {
  username: "",
  login_attempts: 0,
  successful_logins: 0,
  failed_logins: 0,
  password_changes: 0,
  last_login_at: null,
  last_password_change_at: null,
};

let toastTimer = null;

function formatRubles(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatForeign(value, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

function totalBalance() {
  return bankCards.reduce(
    (sum, card) =>
      sum + (card.currency === "RUB" ? card.balance : card.balance * 91.2),
    0,
  );
}

function apiJson(path, options = {}) {
  return fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });
}

function formatTimestamp(value) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value * 1000));
}

async function loadBackendState() {
  try {
    const [stateResponse, statsResponse, cardsResponse] = await Promise.all([
      fetch("/api/state"),
      fetch("/api/auth/stats"),
      fetch("/api/auth/cards"),
    ]);

    if (stateResponse.ok) {
      const state = await stateResponse.json();
      const payload = state?.payload || {};

      if (payload.username) {
        bankStats.username = payload.username;
      }

      if (payload.stats) {
        bankStats = { ...bankStats, ...payload.stats };
      }
    }

    if (statsResponse.ok) {
      bankStats = { ...bankStats, ...(await statsResponse.json()) };
    }

    if (cardsResponse.ok) {
      bankCards = await cardsResponse.json();
    }
  } catch {
    // ignore
  }
}

async function refreshStats() {
  try {
    const response = await fetch("/api/auth/stats");
    if (response.ok) {
      bankStats = { ...bankStats, ...(await response.json()) };
    }
  } catch {
    // Keep the last known snapshot.
  }
}

function getRoute() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  return ["/", "/login", "/reset", "/dashboard"].includes(path) ? path : "/";
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

function setAuthenticated(value) {
  if (value) {
    sessionStorage.setItem(AUTH_KEY, "1");
  } else {
    sessionStorage.removeItem(AUTH_KEY);
  }
}

function navigate(path) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, "", path);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
}

function topbar(activePath) {
  const navItems = [
    ["/", "Главная"],
    ["/login", "Вход"],
  ];

  const nav = navItems
    .map(
      ([path, label]) =>
        `<a class="nav-link ${path === activePath ? "active" : ""}" href="${path}" data-nav="${path}">${label}</a>`,
    )
    .join("");

  return `
    <header class="topbar">
      <div class="brand">
        <a class="no-no-no-link" href="/">
          <div class="brand-mark">G</div>
        </a>
        <div class="brand-text">
          <div class="brand-title">Greenbank</div>
          <div class="brand-subtitle">Личный банк для ежедневных операций</div>
        </div>
      </div>
      <nav class="topbar-nav" aria-label="Основная навигация">
        ${nav}
      </nav>
    </header>
  `;
}

function landingView() {
  return `
    ${topbar("/")}
    <section class="layout-grid landing-layout">
      <article class="hero">
          <span class="eyebrow">Цифровой сервис для частных клиентов</span>
          <h1>Удобный банк для повседневных операций.</h1>
          <p class="hero-copy">
            Greenbank предлагает единый доступ к основным банковским сервисам, личному кабинету и управлению картами.
            Интерфейс ориентирован на быстрый вход и понятную навигацию по ключевым операциям.
          </p>
          <div class="hero-actions">
            <button class="primary-button" data-action="go-login">Войти в кабинет</button>
          </div>
        <div class="hero-stats">
          <div class="stat-card">
            <div class="muted">Среднее время отклика</div>
            <span class="stat-value">0,4 c</span>
          </div>
          <div class="stat-card">
            <div class="muted">Клиентов на обслуживании</div>
            <span class="stat-value">0M</span>
          </div>
          <div class="stat-card">
            <div class="muted">Доступных сервисов</div>
            <span class="stat-value">24</span>
          </div>
        </div>
      </article>

      <aside class="hero-aside">
        <div class="panel">
          <span class="pill">AI-included</span>
          <h2>Банк, опережающий время</h2>
          <p class="panel-copy">Комбинируем привычную банковскую структуру с современными технологиями.</p>
          <ul class="hero-list">
            <li>Работа в более чем в 1 странах мира</li>
            <li>Безосновательные блокировки счетов</li>
            <li>Оплата ухмылкой</li>
            <li>Первый банк без живых сотрудников</li>
            <li>Мод на много денег</li>
          </ul>
        </div>
      </aside>
    </section>

    <section class="panel" style="margin-top: 20px;">
      <div class="panel-top">
        <div>
          <div class="panel-kicker">Сервисы банка</div>
          <h2 class="section-title">Основные возможности личного кабинета</h2>
        </div>
      </div>
      <div class="features-grid">
        <article class="feature-card">
          <div class="feature-icon">▣</div>
          <h3 class="feature-title">Карты и счета</h3>
          <p class="feature-copy">Просмотр балансов, реквизитов и статуса счетов в одном разделе.</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon">◉</div>
          <h3 class="feature-title">Платежи и переводы</h3>
          <p class="feature-copy">Операции между своими счетами, по реквизитам и по номеру карты.</p>
        </article>
        <article class="feature-card">
          <div class="feature-icon">✦</div>
          <h3 class="feature-title">Уведомления и поддержка</h3>
          <p class="feature-copy">Контроль операций, сообщения по важным событиям и доступ к сервисной информации.</p>
        </article>
      </div>
    </section>
  `;
}

function loginView(message = "") {
  return `
    ${topbar("/login")}
    <section class="form-shell">
      <article class="hero form-panel">
        <span class="eyebrow">Доступ для клиента</span>
        <h1 class="form-title">Войдите в Greenbank</h1>
        <p class="form-copy">Введите учётные данные для доступа в личный кабинет и работы с картами.</p>
      </article>

      <article class="glass-card form-card">
        <div>
          <div class="panel-kicker">Авторизация</div>
          <h2 class="form-title">Введите логин и пароль</h2>
          <p class="form-copy">Если забыли пароль, воспользуйтесь формой восстановления доступа.</p>
        </div>
        ${message ? `<div class="notice notice--warning">${message}</div>` : ""}
        <form id="login-form" class="field-grid">
          <div class="field">
            <label for="login">Логин</label>
            <input id="login" name="login" type="text" autocomplete="username" placeholder="greenbank" required />
          </div>
          <div class="field">
            <label for="password">Пароль</label>
            <input id="password" name="password" type="password" autocomplete="current-password" placeholder="Введите пароль" required />
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit">Войти</button>
            <button class="ghost-button" type="button" data-action="go-reset">Забыли пароль?</button>
          </div>
        </form>
        <div class="auth-footer">
          <span class="fineprint">Если возникли вопросы, обратитесь в службу поддержки. Они вам <i>обязательно</i> помогут</span>
          <button class="link-button" type="button" data-action="go-home">Вернуться на главную</button>
        </div>
      </article>
    </section>
  `;
}

function resetView(message = "") {
  const codeRequested = typeof passwordResetCode === "string";

  return `
    ${topbar("/reset")}
    <section class="form-shell">
      <article class="hero form-panel">
        <span class="eyebrow">Восстановление доступа</span>
        <h1 class="form-title">Сброс пароля</h1>
        <p class="form-copy">Для восстановления доступа используется код подтверждения, отправляемый на указанный номер. После успешного подтверждения вы сможете задать новый пароль.</p>
      </article>

      <article class="glass-card form-card">
        <div>
          <h2 class="form-title">Задайте новый пароль</h2>
          <p class="form-copy">Сначала запросите код на номер телефона, затем введите его и новый пароль для аккаунта Greenbank.</p>
        </div>
        ${message ? `<div class="notice">${message}</div>` : ""}
        <form id="reset-form" class="field-grid">
          <div class="field">
            <label for="phone">Телефон</label>
            <input id="phone" name="phone" type="text" autocomplete="tel" placeholder="+7 (999) 123-45-67" required />
          </div>
          ${
            codeRequested
              ? `
          <div class="notice notice--warning">Код отправлен на указанный номер. Введите его ниже.</div>
          <div class="field">
            <label for="code">SMS-код</label>
            <input id="code" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" placeholder="000000" required />
          </div>
          `
              : `
          <div class="field field--inline">
            <label class="sr-only" for="request-code">Получить код</label>
            <button class="primary-button" type="button" id="request-code">Получить код</button>
            <span class="field-hint">После нажатия появится поле для ввода SMS-кода.</span>
          </div>
          `
          }
          <div class="field">
            <label for="new-password">Новый пароль</label>
            <input id="new-password" name="new-password" type="password" autocomplete="new-password" placeholder="Придумайте новый пароль" required />
          </div>
          <div class="form-actions">
            <button class="primary-button" type="submit" ${codeRequested ? "" : "disabled"}>Подтвердить</button>
            <button class="ghost-button" type="button" data-action="go-login">У меня уже есть пароль</button>
          </div>
        </form>
        <div class="auth-footer">
          <button class="link-button" type="button" data-action="go-home">На главную</button>
        </div>
      </article>
    </section>
  `;
}

function dashboardView() {
  const total = totalBalance();
  const cards = bankCards;

  return `
    ${topbar("/dashboard")}
    <section class="layout-grid dashboard-layout">
      <article class="panel summary-card">
        <div class="summary-top">
          <div>
            <div class="panel-kicker">Личный кабинет</div>
            <h1 class="dashboard-title">Добрый день, ${bankStats.username}</h1>
            <p class="dashboard-copy">Здесь отображаются несколько карт, общий баланс и быстрые финансовые операции.</p>
          </div>
          <div class="auth-actions">
            <button class="secondary-button" type="button" data-action="logout">Выйти</button>
          </div>
        </div>

        <div class="accent-line"></div>

        <div class="balance">
          <div class="balance-label">Общий баланс по всем картам</div>
          <div class="balance-amount">${formatRubles(total)}</div>
          <div class="meta">Сумма рассчитана по курсу кабинета и обновляется на лету.</div>
        </div>

        <div class="hero-stats" style="margin-top: 20px;">
          <div class="stat-card">
            <div class="muted">Активные карты</div>
            <span class="stat-value">${cards.length}</span>
          </div>
          <div class="stat-card">
            <div class="muted">Свободный лимит</div>
            <span class="stat-value">${formatRubles(120000)}</span>
          </div>
          <div class="stat-card">
            <div class="muted">Защита</div>
            <span class="stat-value">3D-Sec</span>
          </div>
        </div>

        <div class="panel-stack" style="margin-top: 20px;">
          <div class="panel-top">
            <div>
              <div class="panel-kicker">Карты</div>
              <h2 class="section-title">Баланс по нескольким счетам</h2>
            </div>
          </div>
          <div class="account-list">
            ${cards
              .map(
                (card, index) => `
                  <article class="account-card ${index === 0 ? "account-card--accent" : ""}">
                    <div class="account-top">
                      <div>
                        <div class="account-icon">${index === 0 ? "◈" : index === 1 ? "◎" : "◇"}</div>
                        <h3 class="feature-title" style="margin-top: 12px;">${card.name}</h3>
                        <div class="account-number">${card.number}</div>
                      </div>
                      <span class="pill">${card.status}</span>
                    </div>
                    <div class="account-balance">${card.currency === "RUB" ? formatRubles(card.balance) : formatForeign(card.balance, card.currency)}</div>
                    <div class="account-meta">
                      <span class="pill pill--muted">Greenbank</span>
                      <span class="pill pill--muted">Пластиковая</span>
                    </div>
                  </article>
                `,
              )
              .join("")}
          </div>
        </div>
      </article>

      <aside class="dashboard-grid">
        <div class="panel">
          <div class="service-top">
            <div>
              <div class="panel-kicker">Операции</div>
              <h2 class="section-title">Доступные действия</h2>
            </div>
          </div>
          <div class="service-list">
            ${services
              .map(
                (service) => `
                  <button class="action-tile service-button" type="button" data-action="mock-service" data-service="${service.title}">
                    <div class="service-row">
                      <div class="service-icon">${service.icon}</div>
                      <div>
                        <h3 class="service-title">${service.title}</h3>
                        <p class="service-copy">${service.text}</p>
                      </div>
                    </div>
                  </button>
                `,
              )
              .join("")}
          </div>
        </div>
      </aside>
    </section>
  `;
}

function render() {
  const route = getRoute();

  if (route === "/dashboard" && !isAuthenticated()) {
    window.history.replaceState({}, "", "/login");
    app.innerHTML = loginView("Сначала войдите в систему.");
    document.title = `${APP_TITLE} · Вход`;
    bindCurrentView();
    return;
  }

  if (route === "/") {
    app.innerHTML = landingView();
    document.title = `${APP_TITLE} · Главная`;
  } else if (route === "/login") {
    app.innerHTML = loginView();
    document.title = `${APP_TITLE} · Вход`;
  } else if (route === "/reset") {
    app.innerHTML = resetView();
    document.title = `${APP_TITLE} · Сброс пароля`;
  } else {
    app.innerHTML = dashboardView();
    document.title = `${APP_TITLE} · Кабинет`;
  }

  bindCurrentView();
}

async function bootstrap() {
  await loadBackendState();
  render();
}

function bindCurrentView() {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      navigate(link.getAttribute("data-nav"));
    });
  });

  document.querySelectorAll("[data-action]").forEach((control) => {
    control.addEventListener("click", () => {
      const action = control.getAttribute("data-action");
      if (action === "go-login") {
        navigate("/login");
      }
      if (action === "go-reset") {
        passwordResetCode = null;
        navigate("/reset");
      }
      if (action === "go-home") {
        navigate("/");
      }
      if (action === "logout") {
        setAuthenticated(false);
        showToast("Сеанс завершён");
        navigate("/login");
      }
      if (action === "mock-service") {
        const service = control.getAttribute("data-service") || "Операция";
        showToast(
          `Мы маленькая инди-компания, функционал пока в разработке :c`,
        );
      }
    });
  });

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(loginForm);
      const login = String(formData.get("login") || "").trim();
      const password = String(formData.get("password") || "");

      try {
        const response = await apiJson("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ username: login, password }),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          setAuthenticated(result.token);
          await refreshStats();
          showToast("Вход выполнен");
          navigate("/dashboard");
          return;
        }

        showToast(result.message || "Неверный логин или пароль");
      } catch {
        showToast("Не удалось выполнить вход");
      }
    });
  }

  const resetForm = document.getElementById("reset-form");
  if (resetForm) {
    const requestCodeButton = document.getElementById("request-code");
    if (requestCodeButton) {
      requestCodeButton.addEventListener("click", async () => {
        const phoneInput = document.getElementById("phone");
        const phone = String(phoneInput?.value || "").trim();

        if (phone === "") {
          showToast("Введите номер телефона для получения кода");
          return;
        }

        console.log(phone);

        const response = await fetch("/api/auth/change-password/request-code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        });

        if (response.status !== 200) {
          showToast("Не удалось запросить код. Проверьте правильность логина.");
        }

        const result = await response.json();

        passwordResetCode = result.code;
        showToast("Код отправлен по SMS");
        render();
      });
    }

    resetForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!passwordResetCode) {
        showToast("Сначала получите SMS-код");
        return;
      }

      const formData = new FormData(resetForm);
      const phone = String(formData.get("phone") || "").trim();
      const code = String(formData.get("code") || "").trim();
      const newPassword = String(formData.get("new-password") || "").trim();

      if (phone === "") {
        showToast("Введите номер телефона");
        return;
      }

      if (code !== passwordResetCode) {
        showToast("Неверный SMS-код");
        return;
      }

      if (newPassword.length < 6) {
        showToast("Пароль должен быть не короче 6 символов");
        return;
      }

      try {
        const response = await apiJson("/api/auth/change-password", {
          method: "POST",
          body: JSON.stringify({
            phone,
            code: passwordResetCode,
            new_password: newPassword,
          }),
        });
        const result = await response.json();

        if (response.ok && result.success) {
          passwordResetCode = null;
          await refreshStats();
          showToast("Пароль обновлён");
          navigate("/login");
          return;
        }

        showToast(result.message || "Не удалось обновить пароль");
      } catch {
        showToast("Не удалось обновить пароль");
      }
    });
  }
}

window.addEventListener("popstate", render);
bootstrap();

