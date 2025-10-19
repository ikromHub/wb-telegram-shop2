/* -------------------------------------------------------
   wb-telegram-shop2 — мини-аппа (светлая тема + бонус сразу)
   Страницы: Главная(каталог-карточки/плитки), Оптом, Розница, Склад
   Нижнее меню: Главная / Корзина / Профиль
   Бонус: +300 ₽ автоматически при первом входе (localStorage)
-------------------------------------------------------- */

(function () {
  // ====== Константы под ваш магазин ======
  const WB_SELLER_URL = "https://www.wildberries.ru/seller/525880"; // розница на WB
  const WAREHOUSE_CITY = "Москва";
  const CONTACT_TG = "89996704847"; // Телеграм для связи

  // Когда будут реальные товары — подхватим из /public/products.json
  // Сейчас — плейсхолдеры
  const PLACEHOLDER_PRODUCTS = [
    { sku: "demo-001", title: "Подарочный набор (демо)", price: 1490 },
    { sku: "demo-002", title: "Набор кофе + термос (демо)", price: 1790 },
  ];

  // ====== Небольшой helper по DOM ======
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ====== Состояние приложения ======
  const appState = {
    page: "home", // home | cart | profile
    topTab: "catalog", // catalog | opt | retail | warehouse
    cart: loadCart(),
    bonus: initBonus(), // сразу начисляем 300 ₽, если ещё не было
    products: [], // загрузим/или плейсхолдер
  };

  function loadCart() {
    try {
      return JSON.parse(localStorage.getItem("wb_cart") || "[]");
    } catch {
      return [];
    }
  }

  function saveCart() {
    localStorage.setItem("wb_cart", JSON.stringify(appState.cart));
  }

  function initBonus() {
    const KEY = "wb_bonus";
    let b = Number(localStorage.getItem(KEY) || "0");
    if (!b) {
      b = 300; // бонус сразу
      localStorage.setItem(KEY, String(b));
      // лёгкий тост
      toast("🎁 Начислен приветственный бонус: +300 ₽");
    }
    return b;
  }

  function setBonus(val) {
    appState.bonus = val;
    localStorage.setItem("wb_bonus", String(val));
  }

  // ====== Уведомление (тост) ======
  let toastTimer;
  function toast(text) {
    let el = $("#toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      el.style.cssText =
        "position:fixed;left:50%;bottom:18px;transform:translateX(-50%);background:#111;color:#fff;padding:10px 14px;border-radius:10px;z-index:9999;opacity:.96;max-width:90%;box-shadow:0 8px 22px rgba(0,0,0,.15);font-size:14px;";
      document.body.appendChild(el);
    }
    el.textContent = text;
    el.style.display = "block";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (el.style.display = "none"), 2200);
  }

  // ====== Навигация (нижняя) ======
  function bindBottomNav() {
    $$(".bottom-nav .menu-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = btn.dataset.page;
        if (!page) return;
        appState.page = page;
        $$(".bottom-nav .menu-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        render();
      });
    });
  }

  // ====== Верхние плитки на главной ======
  function topTiles() {
    const tabs = [
      { id: "catalog", label: "Каталог", icon: "🛍" },
      { id: "opt", label: "Оптом", icon: "📦" },
      { id: "retail", label: "Розница", icon: "🏷️" },
      { id: "warehouse", label: "Склад", icon: "🏭" },
    ];

    const wrap = document.createElement("div");
    wrap.className = "top-tiles";
    wrap.style.cssText =
      "display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-bottom:12px";

    tabs.forEach((t) => {
      const item = document.createElement("button");
      item.className = "tile";
      item.innerHTML = `
        <div class="tile-inner" style="border-radius:14px;padding:16px;background:#f7f8fa;border:1px solid #e8eaef;text-align:left">
          <div style="font-size:20px">${t.icon}</div>
          <div style="margin-top:6px;font-weight:600">${t.label}</div>
          <div style="color:#667085;font-size:13px">${tileHint(t.id)}</div>
        </div>`;
      item.addEventListener("click", () => {
        appState.topTab = t.id;
        render();
      });
      wrap.appendChild(item);
    });

    return wrap;
  }

  function tileHint(id) {
    switch (id) {
      case "catalog":
        return "Все товары и подборки";
      case "opt":
        return "От 10 шт — лучшее предложение";
      case "retail":
        return "Поштучно — через WB";
      case "warehouse":
        return "Адрес, график, контакт";
      default:
        return "";
    }
  }

  // ====== Рендер страниц ======
  function render() {
    const root = $("#page-content");
    if (!root) return;
    root.innerHTML = "";

    if (appState.page === "home") {
      // Верхние плитки
      root.appendChild(topTiles());
      // Контент активного верхнего таба
      const section = document.createElement("div");
      section.className = "section";

      if (appState.topTab === "catalog") {
        section.appendChild(renderCatalog());
      }
      if (appState.topTab === "opt") {
        section.appendChild(renderOpt());
      }
      if (appState.topTab === "retail") {
        section.appendChild(renderRetail());
      }
      if (appState.topTab === "warehouse") {
        section.appendChild(renderWarehouse());
      }

      root.appendChild(section);
    }

    if (appState.page === "cart") {
      root.appendChild(renderCart());
    }

    if (appState.page === "profile") {
      root.appendChild(renderProfile());
    }
  }

  // ====== Каталог ======
  function renderCatalog() {
    const box = document.createElement("div");
    const title = h2("Каталог 🎁");
    const sub = pMuted(
      "Пока показываем примеры. Когда будут ваши товары — подставим автоматически."
    );
    box.append(title, sub);

    const grid = document.createElement("div");
    grid.style.cssText =
      "display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-top:10px;";

    (appState.products.length ? appState.products : PLACEHOLDER_PRODUCTS).forEach(
      (prod) => {
        const card = document.createElement("div");
        card.style.cssText =
          "border:1px solid #e8eaef;border-radius:14px;padding:10px;background:#fff;display:flex;flex-direction:column;gap:8px";
        card.innerHTML = `
          <div style="height:96px;border:1px dashed #e8eaef;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#98a2b3;font-size:12px">изображение</div>
          <div style="font-weight:600">${escapeHTML(prod.title)}</div>
          <div style="color:#101828;font-weight:700">${fmtRUB(prod.price)}</div>
          <button class="btn-add" style="border:none;background:#7c5cff;color:#fff;padding:10px;border-radius:10px;cursor:pointer">В корзину</button>
        `;
        card.querySelector(".btn-add").addEventListener("click", () => {
          addToCart(prod);
          toast("Добавлено в корзину");
        });
        grid.appendChild(card);
      }
    );

    box.appendChild(grid);
    return box;
  }

  // ====== Оптом ======
  function renderOpt() {
    const box = document.createElement("div");
    box.append(
      h2("Оптом 📦"),
      p(
        "Принимаем оптовые заказы от 10 шт. Расскажем про цены, сроки и персональную маркировку."
      ),
      ul([
        "Минимальная партия: 10 шт",
        "Гибкая цена и персональная скидка на объёме",
        "Помощь с наклейками / упаковкой под ваш бренд",
      ]),
      mutedBlock(
        `Связь в Telegram: <b>${CONTACT_TG}</b> (напишите «ОПТ», менеджер ответит)`
      )
    );
    return box;
  }

  // ====== Розница ======
  function renderRetail() {
    const box = document.createElement("div");
    box.append(
      h2("Розница 🏷️"),
      p(
        "Поштучные заказы отправляем через Wildberries. Оформляйте в любом регионе, доставка максимально быстро."
      ),
      linkBtn("Открыть магазин на WB", WB_SELLER_URL)
    );
    return box;
  }

  // ====== Склад ======
  function renderWarehouse() {
    const box = document.createElement("div");
    box.append(
      h2("Наш склад 🏭"),
      p(`Город: <b>${WAREHOUSE_CITY}</b>`),
      p(`Контакты: <b>${CONTACT_TG}</b> (Telegram)`),
      pMuted("Работаем ежедневно, время согласуем при заказе или самовывозе.")
    );
    return box;
  }

  // ====== Корзина ======
  function renderCart() {
    const box = document.createElement("div");
    box.append(h2("Корзина"));

    if (!appState.cart.length) {
      box.append(pMuted("Корзина пуста. Перейдите в Каталог, чтобы выбрать товары."));
      return box;
    }

    const list = document.createElement("div");
    list.style.cssText = "display:flex;flex-direction:column;gap:12px;margin-top:8px";

    let subtotal = 0;
    appState.cart.forEach((row, i) => {
      const sum = row.price * row.qty;
      subtotal += sum;
      const item = document.createElement("div");
      item.style.cssText =
        "border:1px solid #e8eaef;border-radius:14px;padding:12px;background:#fff;display:flex;align-items:center;justify-content:space-between;gap:10px";
      item.innerHTML = `
        <div style="flex:1">
          <div style="font-weight:600">${escapeHTML(row.title)}</div>
          <div style="color:#475467;font-size:13px">SKU: ${row.sku}</div>
          <div style="margin-top:6px">${fmtRUB(row.price)} ×
            <button class="qty dec" style="border:1px solid #e8eaef;background:#fff;border-radius:8px;padding:2px 8px;cursor:pointer">−</button>
            <b>${row.qty}</b>
            <button class="qty inc" style="border:1px solid #e8eaef;background:#fff;border-radius:8px;padding:2px 8px;cursor:pointer">+</button>
          </div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">${fmtRUB(sum)}</div>
          <button class="remove" style="margin-top:6px;border:none;background:#ffe8e8;color:#c00;padding:6px 10px;border-radius:8px;cursor:pointer">Убрать</button>
        </div>
      `;
      item.querySelector(".inc").addEventListener("click", () => {
        row.qty++;
        saveCart();
        render();
      });
      item.querySelector(".dec").addEventListener("click", () => {
        row.qty = Math.max(1, row.qty - 1);
        saveCart();
        render();
      });
      item.querySelector(".remove").addEventListener("click", () => {
        appState.cart.splice(i, 1);
        saveCart();
        render();
      });

      list.appendChild(item);
    });

    const bonusUse = Math.min(appState.bonus, subtotal);
    const total = subtotal - bonusUse;

    const sumBlock = document.createElement("div");
    sumBlock.style.cssText =
      "margin-top:10px;border:1px solid #e8eaef;border-radius:14px;padding:12px;background:#fff";
    sumBlock.innerHTML = `
      <div style="display:flex;justify-content:space-between"><span>Товары:</span><b>${fmtRUB(subtotal)}</b></div>
      <div style="display:flex;justify-content:space-between;color:#12a150"><span>Бонусы применены:</span><b>− ${fmtRUB(bonusUse)}</b></div>
      <hr style="border:none;border-top:1px solid #eef0f4;margin:10px 0">
      <div style="display:flex;justify-content:space-between;font-size:18px"><span>Итого к оплате:</span><b>${fmtRUB(total)}</b></div>
      <div style="margin-top:8px;color:#667085;font-size:13px">Доступно бонусов: <b>${fmtRUB(appState.bonus)}</b></div>
      <button id="checkout" style="margin-top:10px;width:100%;border:none;background:#7c5cff;color:#fff;padding:12px;border-radius:12px;cursor:pointer">Оформить заказ</button>
    `;
    sumBlock.querySelector("#checkout").addEventListener("click", () => {
      if (!appState.cart.length) return;
      // Списываем применённые бонусы
      setBonus(appState.bonus - bonusUse);
      // В реальном проекте — запрос на бекенд. Сейчас просто очищаем корзину.
      appState.cart = [];
      saveCart();
      toast("Заказ отправлен! Мы свяжемся с вами.");
      render();
    });

    box.append(list, sumBlock);
    return box;
  }

  // ====== Профиль ======
  function renderProfile() {
    const box = document.createElement("div");
    const card = document.createElement("div");
    card.style.cssText =
      "background:linear-gradient(135deg,#7c5cff,#b798ff);color:#fff;padding:18px;border-radius:16px;box-shadow:0 10px 24px rgba(98,75,255,.25)";
    card.innerHTML = `
      <div style="opacity:.9;font-size:13px">Карта покупателя</div>
      <div style="font-size:28px;font-weight:800;margin-top:4px">podarki365</div>
      <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:end">
        <div>
          <div style="opacity:.85;font-size:12px">Бонусный баланс</div>
          <div style="font-size:22px;font-weight:700">${fmtRUB(appState.bonus)}</div>
        </div>
        <div style="opacity:.9;font-size:12px">ID: #${shortId()}</div>
      </div>
    `;

    const actions = document.createElement("div");
    actions.style.cssText = "margin-top:12px;display:grid;gap:8px";
    actions.append(
      solidBtn("Перейти в Каталог", () => {
        appState.page = "home";
        appState.topTab = "catalog";
        selectBottom("home");
        render();
      }),
      ghostBtn("Написать в Telegram", () => {
        window.open(`https://t.me/${CONTACT_TG}`, "_blank");
      })
    );

    box.append(h2("Профиль"), card, actions);
    return box;
  }

  // ====== Добавление в корзину ======
  function addToCart(prod) {
    const found = appState.cart.find((r) => r.sku === prod.sku);
    if (found) found.qty++;
    else appState.cart.push({ ...prod, qty: 1 });
    saveCart();
  }

  // ====== Хелперы UI ======
  function h2(text) {
    const el = document.createElement("h2");
    el.textContent = text;
    el.style.cssText = "margin:2px 0 8px;font-size:20px";
    return el;
  }
  function p(text) {
    const el = document.createElement("p");
    el.innerHTML = text;
    el.style.margin = "8px 0";
    return el;
  }
  function pMuted(text) {
    const el = p(text);
    el.style.color = "#667085";
    return el;
  }
  function ul(items) {
    const el = document.createElement("ul");
    el.style.cssText = "margin:8px 0 0 18px;color:#344054";
    items.forEach((t) => {
      const li = document.createElement("li");
      li.innerHTML = t;
      el.appendChild(li);
    });
    return el;
  }
  function linkBtn(label, href) {
    const a = document.createElement("a");
    a.textContent = label;
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener";
    a.style.cssText =
      "display:inline-block;margin-top:8px;background:#7c5cff;color:#fff;text-decoration:none;padding:10px 14px;border-radius:12px";
    return a;
  }
  function mutedBlock(html) {
    const d = document.createElement("div");
    d.innerHTML = html;
    d.style.cssText =
      "margin-top:10px;background:#f7f8fa;border:1px solid #e8eaef;border-radius:12px;padding:12px;color:#344054";
    return d;
  }
  function solidBtn(label, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText =
      "border:none;background:#7c5cff;color:#fff;padding:12px;border-radius:12px;cursor:pointer";
    b.addEventListener("click", onClick);
    return b;
  }
  function ghostBtn(label, onClick) {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText =
      "border:1px solid #e8eaef;background:#fff;color:#344054;padding:12px;border-radius:12px;cursor:pointer";
    b.addEventListener("click", onClick);
    return b;
  }
  function fmtRUB(n) {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(n);
  }
  function shortId() {
    const s = (localStorage.getItem("wb_uid") ||
      (() => {
        const v = Math.random().toString(36).slice(2, 8).toUpperCase();
        localStorage.setItem("wb_uid", v);
        return v;
      })());
    return s;
  }
  function selectBottom(page) {
    $$(".bottom-nav .menu-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === page);
    });
  }
  function escapeHTML(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // ====== Загрузка товаров (когда появятся products.json) ======
  async function loadProducts() {
    try {
      const res = await fetch("products.json", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length) {
          appState.products = data;
        }
      }
    } catch {
      // остаёмся на PLACEHOLDER_PRODUCTS
    } finally {
      render();
    }
  }

  // ====== Инициализация ======
  document.addEventListener("DOMContentLoaded", () => {
    bindBottomNav();
    // активируем кнопку "Главная" внизу
    selectBottom(appState.page);
    // Загружаем продукты (если файла нет — покажем демо)
    loadProducts();
  });
})();
