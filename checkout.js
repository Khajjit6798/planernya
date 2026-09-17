/* ══════════════════════════════════════════════════════════════════
   CHECKOUT · логика страницы оплаты
   Без библиотек. Синтаксис простой — работает на iOS 12+ и Android 7+.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── 1. НАСТРОЙКИ · правь только этот блок ─────────────────────── */
  var CONFIG = {
    // Ссылки на оплату по каждому способу.
    // Получи свои ссылки в личном кабинете платёжной системы
    // (ЮKassa, Т-Банк, Robokassa, ЮMoney, Продамус и т.д.)
    // и подставь сюда. Пока пусто — кнопка отправит заказ в Telegram.
    pay: {
      card     : '',
      sbp      : '',
      yoomoney : '',
      robokassa: ''
    },

    // Куда вернуться после успешной оплаты
    successUrl: 'success.html',

    telegram: 'https://t.me/ogdailyplanners',
    mail    : 'girlsmoom@yandex.ru',

    // Промокоды. Значение — скидка в рублях либо {percent: 20}
    promo: {
      'STUDENT': 100,
      'ОГЭ2027': 150,
      'ДРУГ'   : { percent: 20 }
    }
  };

  /* ─── 2. ЭЛЕМЕНТЫ ───────────────────────────────────────────────── */
  var plans      = Array.prototype.slice.call(document.querySelectorAll('.chk-plan'));
  var methods    = Array.prototype.slice.call(document.querySelectorAll('.chk-method'));
  var totalEl    = document.getElementById('totalSum');
  var oldEl      = document.getElementById('totalOld');
  var payBtn     = document.getElementById('payBtn');
  var promoBtn   = document.getElementById('applyPromo');
  var promoInput = document.getElementById('cPromo');
  var promoMsg   = document.getElementById('promoMsg');
  var nameInput  = document.getElementById('cName');
  var contInput  = document.getElementById('cEmail');

  if (!plans.length || !totalEl) return;   // страница собрана не полностью

  var currentPlan  = 'oge-ege';
  var currentPrice = 899;
  var discount     = 0;

  /* ─── 3. ВЫБОР ТАРИФА ───────────────────────────────────────────── */
  function selectPlan(key) {
    var found = false;
    plans.forEach(function (p) {
      var on = p.getAttribute('data-plan') === key;
      p.classList.toggle('on', on);
      p.setAttribute('aria-checked', on ? 'true' : 'false');
      if (on) {
        found = true;
        currentPlan  = key;
        currentPrice = parseInt(p.getAttribute('data-price'), 10) || 0;
      }
    });
    if (!found) { selectPlan('oge-ege'); return; }
    updateTotal();
  }

  function updateTotal() {
    var final = Math.max(0, currentPrice - discount);
    totalEl.textContent = final.toLocaleString('ru-RU') + ' ₽';
    // старая цена показывается, только если скидка реально есть
    if (discount > 0) {
      oldEl.textContent = currentPrice.toLocaleString('ru-RU') + ' ₽';
      oldEl.style.display = '';
    } else {
      oldEl.style.display = 'none';
    }
  }

  plans.forEach(function (p) {
    p.addEventListener('click', function () { selectPlan(p.getAttribute('data-plan')); });
    // карточка работает как радиокнопка: Enter и пробел тоже выбирают
    p.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        selectPlan(p.getAttribute('data-plan'));
      }
    });
  });

  /* ─── 4. СПОСОБ ОПЛАТЫ ──────────────────────────────────────────── */
  function selectMethod(el) {
    methods.forEach(function (x) {
      var on = x === el;
      x.classList.toggle('on', on);
      x.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  methods.forEach(function (m) {
    m.addEventListener('click', function () { selectMethod(m); });
    m.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault(); selectMethod(m);
      }
    });
  });

  /* ─── 5. ПРОМОКОД ───────────────────────────────────────────────── */
  /* Раньше скидку давал любой набор букв — теперь код проверяется
     по списку, а неверный честно об этом сообщает. */
  function applyPromo() {
    var code = promoInput.value.trim().toUpperCase();
    if (!code) { showPromo('Введи код', false); promoInput.focus(); return; }

    var rule = CONFIG.promo[code];
    if (!rule) {
      discount = 0;
      updateTotal();
      showPromo('Такого кода нет. Проверь раскладку и пробелы', false);
      return;
    }

    discount = (typeof rule === 'object' && rule.percent)
      ? Math.round(currentPrice * rule.percent / 100)
      : rule;

    updateTotal();
    showPromo('Код принят: минус ' + discount.toLocaleString('ru-RU') + ' ₽ 🎉', true);
    promoBtn.textContent = 'Применён';
    promoBtn.disabled = true;
    promoInput.readOnly = true;
  }

  function showPromo(text, ok) {
    promoMsg.textContent = text;
    promoMsg.className = 'chk-promo-msg ' + (ok ? 'ok' : 'no');
  }

  promoBtn.addEventListener('click', applyPromo);
  promoInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { e.preventDefault(); applyPromo(); }
  });

  /* ─── 6. ПРОВЕРКА ПОЛЕЙ ─────────────────────────────────────────── */
  function validate() {
    var ok = true;
    [nameInput, contInput].forEach(function (el) {
      var bad = !el.value.trim();
      el.classList.toggle('bad', bad);
      if (bad) ok = false;
    });
    if (!ok) return { ok: false, msg: 'Заполни имя и контакт — иначе не смогу прислать доступ' };

    // контакт должен быть похож на почту или на телеграм
    var v = contInput.value.trim();
    var looksMail = v.indexOf('@') > 0 && v.indexOf('.') > v.indexOf('@');
    var looksTg   = v.charAt(0) === '@' && v.length > 3;
    if (!looksMail && !looksTg) {
      contInput.classList.add('bad');
      return { ok: false, msg: 'Похоже на опечатку: нужен @username или почта' };
    }
    var согласие = document.getElementById('cAgree');
    if (согласие && !согласие.checked) {
      return { ok: false, msg: 'Поставь галочку согласия — без неё оплату принять нельзя' };
    }
    return { ok: true };
  }

  [nameInput, contInput].forEach(function (el) {
    el.addEventListener('input', function () { el.classList.remove('bad'); });
  });

  /* ─── 7. КНОПКА ОПЛАТЫ ──────────────────────────────────────────── */
  payBtn.addEventListener('click', function () {
    var check = validate();
    if (!check.ok) {
      toast(check.msg);
      var bad = document.querySelector('.chk-field input.bad');
      if (bad) { bad.focus(); bad.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }

    var methodEl = document.querySelector('.chk-method.on') || methods[0];
    var planEl   = document.querySelector('.chk-plan.on')   || plans[0];
    var method   = methodEl.getAttribute('data-method');
    var finalPrice = Math.max(0, currentPrice - discount);

    var order = {
      plan    : currentPlan,
      planName: planEl.getAttribute('data-name'),
      price   : finalPrice,
      method  : method,
      name    : nameInput.value.trim(),
      contact : contInput.value.trim(),
      promo   : promoInput.value.trim()
    };

    var baseUrl = CONFIG.pay[method];

    // Если ссылка на оплату заполнена — уходим на платёжную форму
    if (baseUrl) {
      var url;

      // Для ЮMoney / ЮKassa / Robokassa — подставляем сумму в GET-параметры
      if (method === 'card' || method === 'sbp' || method === 'yoomoney') {
        url = baseUrl + finalPrice +
              '&label=' + encodeURIComponent(currentPlan + '|' + order.contact) +
              '&successURL=' + encodeURIComponent(
                window.location.origin + '/' + CONFIG.successUrl
              );
      }
      // Для Т-Банка и остальных — используем ссылку как есть
      else {
        url = baseUrl;
      }

      // Сохраняем заказ, чтобы success.html показала детали
      try { sessionStorage.setItem('og_order', JSON.stringify(order)); } catch(e) {}

      window.location.href = url;
      return;
    }

    // Ссылки нет — не теряем заказ: складываем письмо в телеграм
    var text = 'Заказ с сайта%0A%0A' +
      'Тариф: '  + encodeURIComponent(order.planName) + '%0A' +
      'К оплате: ' + order.price + ' ₽%0A' +
      'Способ: ' + encodeURIComponent(methodEl.querySelector('.pay-name').textContent) + '%0A' +
      'Имя: '    + encodeURIComponent(order.name) + '%0A' +
      'Контакт: ' + encodeURIComponent(order.contact) +
      (order.promo ? '%0AПромокод: ' + encodeURIComponent(order.promo) : '');

    /* Ссылка оплаты не подключена — уводим заказ в телеграм,
       чтобы он не потерялся. Раньше здесь стояла проверка на
       заглушку 'your_username'; телеграм заполнен, проверка
       осталась мёртвой строкой — заменена на честную. */
    if (CONFIG.telegram) {
      window.open(CONFIG.telegram + '?text=' + text, '_blank');
      toast('Открываю телеграм — отправь сообщение, и пришлём ссылку на оплату 💬');
    } else {
      toast('Оплата пока не подключена. Заказ собран — подставь ссылки в CONFIG');
      if (window.console && console.log) console.log('ЗАКАЗ:', order);
    }
  });

  /* ─── 8. ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ ──────────────────────────────────── */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.setAttribute('role', 'status');
      toastEl.style.cssText =
        'position:fixed;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));' +
        'transform:translate(-50%,180%);background:#1B1C3A;color:#fff;' +
        'padding:14px 24px;border-radius:999px;font:600 14px/1.4 Manrope,sans-serif;' +
        'box-shadow:0 16px 40px rgba(27,28,58,.28);z-index:200;' +
        'transition:transform .38s cubic-bezier(.2,.8,.3,1);' +
        'max-width:calc(100vw - 32px);text-align:center';
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = msg;
    // перерисовка нужна, чтобы transition сработал при повторном показе
    void toastEl.offsetWidth;
    toastEl.style.transform = 'translate(-50%,0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.style.transform = 'translate(-50%,180%)';
    }, 4200);
  }

  /* ─── 9. ТАРИФ ИЗ ССЫЛКИ ────────────────────────────────────────── */
  /* URLSearchParams есть не везде — читаем строку запроса вручную */
  function paramFromUrl(key) {
    var q = window.location.search.replace(/^\?/, '').split('&');
    for (var i = 0; i < q.length; i++) {
      var pair = q[i].split('=');
      if (decodeURIComponent(pair[0]) === key) return decodeURIComponent(pair[1] || '');
    }
    return '';
  }

  selectPlan(paramFromUrl('plan') || 'oge-ege');
  updateTotal();
})();

/* ─── 10. ВОЗВРАТ ТУДА, ГДЕ ЧЕЛОВЕК ОСТАНОВИЛСЯ ───────────────────
   Кнопка «К тарифам» ведёт на index.html#price. Но если человек
   пришёл сюда с сайта, честнее вернуть его ровно на то место,
   откуда он ушёл, — браузер сам восстановит позицию прокрутки.   */
(function () {
  var back = document.querySelector('.chk-back');
  if (!back) return;

  /* Пришёл ли он с нашего же сайта */
  var своя = false;
  try {
    своя = document.referrer &&
           new URL(document.referrer).origin === window.location.origin &&
           document.referrer.indexOf('checkout') === -1;
  } catch (e) {}

  if (!своя) return;                 /* зашёл по прямой ссылке — оставляем #price */

  back.addEventListener('click', function (e) {
    e.preventDefault();
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html#price';
  });
})();
