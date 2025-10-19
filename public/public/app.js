/* -----------------------------
   Простейшее состояние мини-аппы
------------------------------*/
const appState = {
  page: 'home',
  bonusGranted: false,
  bonusAmount: 300,
  cart: [],
  products: [], // позже подгрузим с WB или products.json
};

// простая утилита
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

/* -----------------------------
   Роутинг по вкладкам (верх/низ)
------------------------------*/
function bindTopMenu() {
  $$('.top-menu .menu-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectTop(btn.dataset.page);
    });
  });
}

function bindBottomNav() {
  $$('.bottom-nav .nav-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectBottom(btn.dataset.page);
    });
  });
}

function selectTop(page) {
  appState.page = page;
  $$('.top-menu .menu-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.page === page)
  );
  // синхронизируем нижнее меню: home ↔ главная, cart ↔ корзина, profile ↔ профиль
  const bottomPage = page === 'home' ? 'home' : (page === 'cart' ? 'cart' : (page === 'profile' ? 'profile' : 'home'));
  selectBottom(bottomPage, { keepTop: true });
  render();
}

function selectBottom(page, opts = {}) {
  if (!opts.keepTop) {
    // если жмём снизу — активируем соответствующую верхнюю кнопку (home)
    if (page === 'home') {
      appState.page = 'home';
      $$('.top-menu .menu-btn').forEach((b) =>
        b.classList.toggle('active', b.dataset.page === 'home')
      );
    } else if (page === 'cart') {
      appState.page = 'cart';
      $$('.top-menu .menu-btn').forEach((b) => b.classList.remove('active'));
    } else if (page === 'profile') {
      appState.page = 'profile';
      $$('.top-menu .menu-btn').forEach((b) => b.classList.remove('active'));
    }
  }
  $$('.bottom-nav .nav-btn').forEach((b) =>
    b.classList.toggle('active', b.dataset.page === page)
  );
  render();
}

/* -----------------------------
   РЕНДЕР СТРАНИЦ
------------------------------*/
function hideAllScreens() {
  $$('.screen').forEach((s) => (s.hidden = true));
}

function render() {
  hideAllScreens();

  switch (appState.page) {
    case 'home':
      renderHome();
      $('#screen-home').hidden = false;
      break;
    case 'b2b':
      renderB2B();
      $('#screen-b2b').hidden = false;
      break;
    case 'retail':
      renderRetail();
      $('#screen-retail').hidden = false;
      break;
    case 'warehouse':
      renderWarehouse();
      $('#screen-warehouse').hidden = false;
      break;
    case 'cart':
      renderCart();
      $('#screen-cart').hidden = false;
      break;
    case 'profile':
      renderProfile();
      $('#screen-profile').hidden = false;
      break;
  }
}

/* -----------------------------
   HOME: Каталог
------------------------------*/
function renderHome() {
  const el = $('#screen-home');
  el.innerHTML = '';

  if (!appState.products || appState.products.length === 0) {
    el.innerHTML = `
      <div class="empty">
        Пока товаров нет. Добавим позже из WB 👇<br/>
        <a class="link" href="https://www.wildberries.ru/seller/525880" target="_blank">Открыть магазин на Wildberries</a>
      </div>
    `;
    return;
  }

  const list = document.createElement('div');
  list.className = 'cards';
  appState.products.forEach((p, idx) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="img"></div>
      <div class="title">${p.title}</div>
      <div class="price">${formatPrice(p.price)} ₽</div>
      <button class="buy" data-idx="${idx}">Купить</button>
    `;
    list.appendChild(card);
  });
  el.appendChild(list);

  el.querySelectorAll('.buy').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.dataset.idx);
      addToCart(appState.products[i]);
      selectBottom('cart');
    });
  });
}

/* -----------------------------
   ОПТОМ
------------------------------*/
function renderB2B() {
  $('#screen-b2b').innerHTML = `
    <div class="text">
      <h2>Оптом</h2>
      <p>Заказы от <b>10&nbsp;шт.</b> одного товара.</p>
      <p>Напишите нам в Telegram для прайса и условий: <a class="link" href="https://t.me/89996704847" target="_blank">@89996704847</a></p>
    </div>
  `;
}

/* -----------------------------
   РОЗНИЦА
------------------------------*/
function renderRetail() {
  $('#screen-retail').innerHTML = `
    <div class="text">
      <h2>Розница</h2>
      <p>По 1 шт мы сами не отправляем, но вы можете заказать на WB:</p>
      <p><a class="button-link" href="https://www.wildberries.ru/seller/525880" target="_blank">Открыть на Wildberries</a></p>
    </div>
  `;
}

/* -----------------------------
   СКЛАД
------------------------------*/
function renderWarehouse() {
  $('#screen-warehouse').innerHTML = `
    <div class="text">
      <h2>Наш склад</h2>
      <p><b>Город:</b> Москва</p>
      <p><b>Контакты:</b> Telegram <a class="link" href="https://t.me/89996704847" target="_blank">89996704847</a></p>
      <p>Готовим самовывоз/доставку — уточняйте в Telegram.</p>
    </div>
  `;
}

/* -----------------------------
   КОРЗИНА
------------------------------*/
function addToCart(product) {
  const existing = appState.cart.find((i) => i.sku === product.sku);
  if (existing) existing.qty += 1;
  else appState.cart.push({ ...product, qty: 1 });
}

function cartTotalRaw() {
  const subtotal = appState.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const bonus = appState.bonusGranted ? appState.bonusAmount : 0;
  return Math.max(subtotal - bonus, 0);
}

function formatPrice(n) {
  return (Math.round(n * 100) / 100).toLocaleString('ru-RU');
}

function renderCart() {
  const el = $('#screen-cart');
  el.innerHTML = '';

  if (appState.cart.length === 0) {
    el.innerHTML = `<div class="empty">Корзина пуста</div>`;
    return;
  }

  const list = document.createElement('div');
  list.className = 'cart-list';
  appState.cart.forEach((i, idx) => {
    const row = document.createElement('div');
    row.className = 'cart-item';
    row.innerHTML = `
      <div class="meta">
        <div class="t">${i.title}</div>
        <div class="p">${formatPrice(i.price)} ₽</div>
      </div>
      <div class="qty">
        <button class="q-btn" data-act="dec" data-idx="${idx}">−</button>
        <span>${i.qty}</span>
        <button class="q-btn" data-act="inc" data-idx="${idx}">+</button>
      </div>
    `;
    list.appendChild(row);
  });

  const info = document.createElement('div');
  info.className = 'cart-summary';
  const subtotal = appState.cart.reduce((s, i) => s + i.price * i.qty, 0);
  info.innerHTML = `
    <div class="line"><span>Сумма:</span><b>${formatPrice(subtotal)} ₽</b></div>
    <div class="line"><span>Бонусы:</span><b>${appState.bonusGranted ? `− ${formatPrice(appState.bonusAmount)} ₽` : '0 ₽'}</b></div>
    <div class="line total"><span>Итого к оплате:</span><b>${formatPrice(cartTotalRaw())} ₽</b></div>
    <button class="primary">Оформить</button>
  `;

  el.appendChild(list);
  el.appendChild(info);

  el.querySelectorAll('.q-btn').forEach((b) => {
    b.addEventListener('click', () => {
      const idx = Number(b.dataset.idx);
      const act = b.dataset.act;
      if (act === 'inc') appState.cart[idx].qty += 1;
      else {
        appState.cart[idx].qty -= 1;
        if (appState.cart[idx].qty <= 0) appState.cart.splice(idx, 1);
      }
      render();
    });
  });

  info.querySelector('.primary').addEventListener('click', () => {
    alert('Оформление подключим после интеграции оплаты/формы. ✔️');
  });
}

/* -----------------------------
   ПРОФИЛЬ (+ приветственный бонус)
------------------------------*/
function ensureWelcomeBonus() {
  try {
    const key = 'podarki365_bonus_granted';
    const granted = localStorage.getItem(key);
    if (!granted) {
      appState.bonusGranted = true;
      localStorage.setItem(key, '1');
    } else {
      appState.bonusGranted = true; // показываем как активный (если надо — можно сделать одноразовым отображением)
    }
  } catch (e) {
    // если localStorage недоступен
    appState.bonusGranted = true;
  }
}

function renderProfile() {
  const el = $('#screen-profile');
  const bonus = appState.bonusGranted ? appState.bonusAmount : 0;

  el.innerHTML = `
    <div class="profile-card">
      <div class="brand">podarki365</div>
      <div class="owner">Именная карта</div>
      <div class="bonus">Бонус: +${bonus} ₽</div>
    </div>
    <div class="text small">
      * Бонус применяется автоматически при оформлении заказа в корзине.
      Пример: если в корзине 10 шт по 1 500 ₽ (= 15 000 ₽), то с бонусом — 14 700 ₽.
    </div>
  `;
}

/* -----------------------------
   ИНИЦИАЛИЗАЦИЯ
------------------------------*/
function init() {
  bindTopMenu();
  bindBottomNav();
  selectBottom('home'); // выставим нижнюю навигацию
  ensureWelcomeBonus();
  render();
}

document.addEventListener('DOMContentLoaded', init);
