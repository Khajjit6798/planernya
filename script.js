/* ══════════════════════════════════════════════════════════════════
   ПЛАНЕР ОГЭ · СКРИПТЫ
   Без библиотек. Синтаксис намеренно простой — работает на iOS 12+
   и Android 7+, где нет ?. и ??
   ══════════════════════════════════════════════════════════════════ */

/* ─── 1. НАСТРОЙКИ · правь только этот блок ───────────────────────── */
var CONFIG = {
  // Ссылки оплаты. Пока пустые — кнопка ведёт к форме вместо перехода.
  // Подойдёт любая: ЮKassa, Т-Банк, Boosty, Taplink, Продамус.
  pay: {
    'ОГЭ · 599 ₽'          : '',
    'ОГЭ + ЕГЭ · 899 ₽'    : '',
    'Вся линейка · 1 490 ₽': ''
  },
  telegram : 'https://t.me/ogdailyplanners',
  instagram: 'https://www.instagram.com/invites/contact/?utm_source=ig_contact_invite&utm_medium=copy_link&utm_content=etjjkhp',
  vk       : 'https://vk.ru/club241249160',

  // ─── КУДА ПРИХОДЯТ ЗАЯВКИ С ФОРМЫ ──────────────────────────────
  // Сайт из одних HTML-файлов сам письма слать не умеет, нужен
  // посредник. Formspree бесплатен до 50 заявок в месяц.
  //
  // ЧТО СДЕЛАТЬ ОДИН РАЗ:
  //  1. formspree.io → Sign up → New form
  //  2. указать почту, куда слать заявки
  //  3. скопировать адрес вида https://formspree.io/f/abcdwxyz
  //  4. вставить его в formEndpoint ниже
  //
  // Пока строка пустая, форма работает запасным путём: открывает
  // почтовую программу с уже готовым письмом.
  formEndpoint: '',

  /* Почта и телефон взяты из оферты — они должны совпадать с ней
     слово в слово, иначе модератор платёжной системы придерётся. */
  mail     : 'pophalo90@gmail.com',
  phone    : '+7 912 018-03-93',

  examDate : '2027-05-24',   // ориентировочная дата ОГЭ
  yearStart: '2026-09-01',   // от чего считать шкалу прогресса

  // Ссылка на демо-таблицу — отдельная копия планера на Диске.
  // Рабочий файл остаётся закрытым, посетители видят только копию.
  //
  // ВАЖНО, ОДИН РАЗ: открой копию → «Настройки доступа» →
  // «Доступ по ссылке» → «Все, у кого есть ссылка» → роль «Читатель».
  // Пока это не сделано, у чужих людей откроется «Запросить доступ».
  //
  // /preview вместо /edit — открывается сразу в режиме чтения,
  // без панелей редактирования и без кнопки «Файл».
  demo: 'https://docs.google.com/spreadsheets/d/1023zEdxJcH2_39EFjNKstUvvteJHusowIeBXAf2SmJs/preview'
};

/* Сообщаем стилям, что скрипты живы: блоки можно прятать до появления */
document.documentElement.classList.remove('no-js');

/* ─── 2. ШАПКА · уплотняется при прокрутке ────────────────────────── */
var hdr = document.getElementById('hdr');
window.addEventListener('scroll', function () {
  if (window.pageYOffset > 30) hdr.classList.add('small');
  else hdr.classList.remove('small');
}, { passive: true });

/* ─── 3. МОБИЛЬНОЕ МЕНЮ ───────────────────────────────────────────── */
var burger = document.getElementById('burger');
var menu   = document.getElementById('menu');

burger.addEventListener('click', function () {
  var open = menu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open ? 'true' : 'false');
  burger.textContent = open ? '✕' : '☰';
});
// клик по пункту — меню закрывается
Array.prototype.forEach.call(menu.querySelectorAll('a'), function (a) {
  a.addEventListener('click', function () {
    menu.classList.remove('open');
    burger.textContent = '☰';
    burger.setAttribute('aria-expanded', 'false');
  });
});
// тап мимо меню — тоже закрывается
document.addEventListener('click', function (e) {
  if (!menu.classList.contains('open')) return;
  if (menu.contains(e.target) || burger.contains(e.target)) return;
  menu.classList.remove('open');
  burger.textContent = '☰';
  burger.setAttribute('aria-expanded', 'false');
});

/* ─── 4. ПОДСВЕТКА АКТИВНОГО ПУНКТА МЕНЮ ──────────────────────────── */
var links = Array.prototype.slice.call(menu.querySelectorAll('a'));
var secs  = links.map(function (a) {
  return document.querySelector(a.getAttribute('href'));
}).filter(Boolean);

if (window.IntersectionObserver) {
  var navObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      links.forEach(function (l) {
        var on = l.getAttribute('href') === '#' + e.target.id;
        l.classList.toggle('on', on);
      });
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  secs.forEach(function (s) { navObs.observe(s); });
}

/* ─── 5. ПОЯВЛЕНИЕ БЛОКОВ ПРИ ПРОКРУТКЕ ───────────────────────────── */
var revealables = document.querySelectorAll('.reveal');
if (window.IntersectionObserver) {
  var revObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      revObs.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  Array.prototype.forEach.call(revealables, function (el) { revObs.observe(el); });
} else {
  // старый браузер — просто показываем всё
  Array.prototype.forEach.call(revealables, function (el) { el.classList.add('in'); });
}

/* ─── 6. СЧЁТЧИК ДНЕЙ ДО ОГЭ ──────────────────────────────────────── */
(function countdown() {
  var num = document.getElementById('cdNum');
  var txt = document.getElementById('cdTxt');
  var bar = document.getElementById('cdBar');
  if (!num) return;

  var exam  = new Date(CONFIG.examDate + 'T00:00:00');
  var start = new Date(CONFIG.yearStart + 'T00:00:00');
  var now   = new Date(); now.setHours(0, 0, 0, 0);
  var days  = Math.round((exam - now) / 86400000);

  if (isNaN(days)) { num.textContent = '—'; txt.textContent = 'дата не задана'; return; }

  if (days < 0) {
    num.textContent = '0';
    txt.textContent = 'экзамены этого года позади — самое время начать следующий круг';
    bar.style.width = '100%';
    return;
  }

  // число доезжает анимацией, а не появляется резко
  var cur = 0;
  var step = Math.max(1, Math.ceil(days / 34));
  var tick = setInterval(function () {
    cur += step;
    if (cur >= days) { cur = days; clearInterval(tick); }
    num.textContent = cur.toLocaleString('ru-RU');
  }, 26);

  // полоска: сколько учебного года уже прошло
  var total = Math.max(1, Math.round((exam - start) / 86400000));
  var gone  = Math.min(100, Math.max(0, Math.round((1 - days / total) * 100)));
  setTimeout(function () { bar.style.width = gone + '%'; }, 250);

  var w = Math.floor(days / 7);
  txt.textContent = w > 0
    ? 'это примерно ' + w + ' ' + plural(w, 'неделя', 'недели', 'недель') + ' подготовки'
    : 'осталась последняя неделя';
})();

/** Склонение: 1 неделя, 3 недели, 8 недель */
function plural(n, one, few, many) {
  var a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return many;
  if (b > 1 && b < 5) return few;
  if (b === 1) return one;
  return many;
}

/* ─── 7. КАРУСЕЛЬ ЛИСТОВ ──────────────────────────────────────────── */
var track   = document.getElementById('track');
var slides  = Array.prototype.slice.call(track.children);
var dotsBox = document.getElementById('dots');
var prevBtn = document.getElementById('prev');
var nextBtn = document.getElementById('next');

// точки под каруселью
slides.forEach(function (_, i) {
  var d = document.createElement('button');
  d.className = 'dot' + (i ? '' : ' on');
  d.setAttribute('aria-label', 'Лист ' + (i + 1));
  d.addEventListener('click', function () { scrollToSlide(i); });
  dotsBox.appendChild(d);
});
var dots = Array.prototype.slice.call(dotsBox.children);

/*
 * ПОЧЕМУ ЗДЕСЬ getBoundingClientRect, А НЕ offsetLeft
 *
 * offsetLeft отсчитывается от ближайшего позиционированного предка.
 * У секции «Как выглядит» стоит position:relative (там живут стикеры),
 * поэтому предком оказывался не трек, а сама секция — и в offsetLeft
 * попадали её отступы. scrollLeft при этом считается от начала трека.
 * Расхождение копилось от слайда к слайду: третий проскакивал,
 * четвёртый уезжал вправо.
 *
 * Экранные координаты от этого не зависят вообще: меряем, насколько
 * центр слайда отстоит от центра трека, и сдвигаем ровно на эту разницу.
 */

/** Слайд, ближайший к центру трека */
function currentIndex() {
  var tr = track.getBoundingClientRect();
  var mid = tr.left + tr.width / 2;
  var best = 0, min = Infinity;
  slides.forEach(function (s, i) {
    var r = s.getBoundingClientRect();
    var d = Math.abs(r.left + r.width / 2 - mid);
    if (d < min) { min = d; best = i; }
  });
  return best;
}

/** Ставит слайд ровно по центру трека */
function scrollToSlide(i) {
  var k = Math.max(0, Math.min(slides.length - 1, i));
  var s = slides[k];
  var tr = track.getBoundingClientRect();
  var r  = s.getBoundingClientRect();
  var delta = (r.left + r.width / 2) - (tr.left + tr.width / 2);
  if (Math.abs(delta) < 1) return;

  // smooth есть не везде — на старых браузерах просто мгновенный переход
  if ('scrollBehavior' in document.documentElement.style) {
    track.scrollBy({ left: delta, behavior: 'smooth' });
  } else {
    track.scrollLeft += delta;
  }
}

/** Обновляет точки и блокирует стрелки на краях */
function sync() {
  var i = currentIndex();
  dots.forEach(function (d, k) { d.classList.toggle('on', k === i); });
  // по индексу, а не по пикселям: последний слайд у края не всегда
  // может встать ровно по центру, и пиксельная проверка врала
  prevBtn.disabled = i === 0;
  nextBtn.disabled = i === slides.length - 1;
}

prevBtn.addEventListener('click', function () { scrollToSlide(currentIndex() - 1); });
nextBtn.addEventListener('click', function () { scrollToSlide(currentIndex() + 1); });
track.addEventListener('scroll', function () {
  window.requestAnimationFrame(sync);
}, { passive: true });
track.addEventListener('keydown', function (e) {
  if (e.key === 'ArrowRight') { e.preventDefault(); scrollToSlide(currentIndex() + 1); }
  if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollToSlide(currentIndex() - 1); }
});
window.addEventListener('resize', sync);
sync();

/* ─── 8. FAQ · аккордеон ──────────────────────────────────────────── */
Array.prototype.forEach.call(document.querySelectorAll('#faqBox .q'), function (q) {
  var btn = q.querySelector('button');
  var ans = q.querySelector('.a');
  btn.setAttribute('aria-expanded', 'false');

  btn.addEventListener('click', function () {
    var wasOpen = q.classList.contains('open');
    // закрываем всё
    Array.prototype.forEach.call(document.querySelectorAll('#faqBox .q.open'), function (o) {
      o.classList.remove('open');
      o.querySelector('.a').style.maxHeight = null;
      o.querySelector('button').setAttribute('aria-expanded', 'false');
    });
    // открываем нажатый, если он был закрыт
    if (!wasOpen) {
      q.classList.add('open');
      ans.style.maxHeight = ans.scrollHeight + 'px';
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});
// после поворота экрана высота раскрытого ответа меняется
window.addEventListener('resize', function () {
  var open = document.querySelector('#faqBox .q.open .a');
  if (open) open.style.maxHeight = open.scrollHeight + 'px';
});

/* ─── 9. ВСПЛЫВАЮЩЕЕ СООБЩЕНИЕ ────────────────────────────────────── */
var toastTimer;
function toast(msg) {
  var t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { t.classList.remove('show'); }, 4200);
}

/* ─── 10. КНОПКИ ПОКУПКИ ──────────────────────────────────────────── */
// Кнопки тарифов — ссылки на checkout.html. Если кнопка не <a>, ведём на checkout.
Array.prototype.forEach.call(document.querySelectorAll('.buy'), function (b) {
  if (b.tagName === 'A') return; // уже ссылка — не трогаем
  b.addEventListener('click', function () {
    var plan = b.getAttribute('data-plan');
    var map = {
      'ОГЭ · 599 ₽': 'oge',
      'ОГЭ + ЕГЭ · 899 ₽': 'oge-ege',
      'Вся линейка · 1 490 ₽': 'full'
    };
    var key = map[plan] || 'oge-ege';
    window.location.href = 'checkout.html?plan=' + key;
  });
});

/* ─── 11. КОНТАКТЫ ────────────────────────────────────────────────── */
Array.prototype.forEach.call(document.querySelectorAll('[data-contact]'), function (a) {
  var k = a.getAttribute('data-contact');
  var href = k === 'mail' ? 'mailto:' + CONFIG.mail : CONFIG[k];
  var filled = href && !/your_|example\.ru/.test(href);

  if (filled) {
    a.href = href;
    if (k !== 'mail') { a.target = '_blank'; a.rel = 'noopener'; }
  } else {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      toast('Контакт пока не заполнен — подставь его в CONFIG');
    });
  }
});

/* ─── 12. ФОРМА ЗАЯВКИ ──────────────────────────────────────────────
   Два пути отправки. Основной — Formspree: заявка уходит письмом,
   человек остаётся на сайте. Запасной — почтовая программа с уже
   собранным письмом: работает всегда, но часть людей на этом шаге
   отваливается, поэтому он именно запасной.                       */
var form = document.getElementById('form');
if (form) form.addEventListener('submit', function (e) {
  e.preventDefault();

  var name    = form.elements['name'];
  var contact = form.elements['contact'];
  var plan    = form.elements['plan'];
  var msg     = form.elements['msg'];
  var btn     = form.querySelector('button[type="submit"]');

  if (!name.value.trim() || !contact.value.trim()) {
    toast('Заполни имя и контакт — иначе мы не сможем ответить');
    (name.value.trim() ? contact : name).focus();
    return;
  }

  /* Контакт должен быть похож на почту или на телеграм */
  var v = contact.value.trim();
  var почта = v.indexOf('@') > 0 && v.indexOf('.') > v.indexOf('@');
  var телега = v.charAt(0) === '@' && v.length > 3;
  if (!почта && !телега) {
    toast('Похоже на опечатку: нужен @username или адрес почты');
    contact.focus();
    return;
  }

  /* Без согласия отправлять нельзя: иначе галочка ничего не значит */
  var согласие = document.getElementById('fagree');
  if (согласие && !согласие.checked) {
    toast('Поставь галочку согласия — без неё мы не имеем права ответить');
    согласие.focus();
    return;
  }

  var заявка = {
    name    : name.value.trim(),
    contact : contact.value.trim(),
    plan    : plan.value,
    msg     : msg.value.trim() || '—'
  };

  /* ── Путь 1: Formspree ──────────────────────────────────────── */
  if (CONFIG.formEndpoint) {
    btn.disabled = true;
    var было = btn.textContent;
    btn.textContent = 'Отправляем…';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', CONFIG.formEndpoint, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.onload = function () {
      btn.disabled = false;
      btn.textContent = было;
      if (xhr.status >= 200 && xhr.status < 300) {
        toast('Заявка ушла. Ответим в течение дня 💌');
        form.reset();
      } else {
        toast('Не получилось отправить — открываем почту');
        письмом(заявка);
      }
    };
    /* Нет сети — не теряем заявку, уводим в почту */
    xhr.onerror = function () {
      btn.disabled = false;
      btn.textContent = было;
      toast('Нет связи с сервером — открываем почту');
      письмом(заявка);
    };
    xhr.send(JSON.stringify({
      _subject : 'Заявка с сайта · ' + заявка.plan,
      name     : заявка.name,
      contact  : заявка.contact,
      plan     : заявка.plan,
      message  : заявка.msg
    }));
    return;
  }

  /* ── Путь 2: почтовая программа ─────────────────────────────── */
  письмом(заявка);
  form.reset();
});

/* Собирает письмо и отдаёт его почтовой программе. Перевод строки
   в mailto пишется как %0D%0A — иначе часть клиентов склеит текст. */
function письмом (з) {
  var бр = '%0D%0A';
  var тело =
    'Имя: '     + encodeURIComponent(з.name)    + бр +
    'Контакт: ' + encodeURIComponent(з.contact) + бр +
    'Тариф: '   + encodeURIComponent(з.plan)    + бр + бр +
    'Вопрос:'   + бр + encodeURIComponent(з.msg);

  var адрес = CONFIG.mail && CONFIG.mail.indexOf('ЗАМЕНИ') === -1
    ? CONFIG.mail : '';

  if (!адрес) {
    toast('Почта не настроена. Впиши её в CONFIG.mail в файле script.js');
    if (window.console && console.log) console.log('ЗАЯВКА:', з);
    return;
  }

  window.location.href = 'mailto:' + адрес +
    '?subject=' + encodeURIComponent('Заявка с сайта · ' + з.plan) +
    '&body=' + тело;
  toast('Открываем почту — осталось нажать «Отправить» 💌');
}

/* ─── 13. ПЕРЕКЛЮЧАТЕЛЬ ПАЛИТР ────────────────────────────────────
   Кнопка показывает свой снимок и прячет остальные. Картинки лежат
   в разметке, а не подставляются в src — так браузер не мигает белым
   при первом переключении и всё работает даже без сети.            */
(function () {
  var btns  = Array.prototype.slice.call(document.querySelectorAll('.pal-btn'));
  var shots = Array.prototype.slice.call(document.querySelectorAll('.pal-shot'));
  if (!btns.length || !shots.length) return;

  function show(key) {
    btns.forEach(function (b) {
      var on = b.getAttribute('data-pal') === key;
      b.classList.toggle('on', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    shots.forEach(function (f) {
      var on = f.getAttribute('data-pal') === key;
      f.classList.toggle('on', on);
      if (on) { f.removeAttribute('hidden'); }
      else    { f.setAttribute('hidden', ''); }
    });
  }

  btns.forEach(function (b, i) {
    b.addEventListener('click', function () { show(b.getAttribute('data-pal')); });
    /* Стрелками — как по вкладкам: привычно и доступно с клавиатуры */
    b.addEventListener('keydown', function (e) {
      var k = e.key, j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % btns.length;
      if (k === 'ArrowLeft'  || k === 'ArrowUp')   j = (i - 1 + btns.length) % btns.length;
      if (j < 0) return;
      e.preventDefault();
      btns[j].focus();
      show(btns[j].getAttribute('data-pal'));
    });
  });
})();

/* ─── 16. БЕГУЩАЯ СТРОКА ──────────────────────────────────────────── */
/* Дублируем содержимое, чтобы лента ехала без стыка.
   Анимация сдвигает ровно на половину — вторая копия встаёт на место первой. */
(function ticker() {
  var row = document.getElementById('tickerRow');
  if (!row) return;
  row.innerHTML += row.innerHTML;
})();

/* ─── 17. МЕЛОЧИ ──────────────────────────────────────────────────── */
document.getElementById('year').textContent = new Date().getFullYear();

/* ─── 16. ОКНО ПРОСМОТРА ЛИСТА ────────────────────────────────────
   Клик по любому снимку открывает его поверх сайта. Список картинок
   собирается один раз со всех ссылок .zoom, поэтому листать можно
   и те, что в карусели, и те, что в галерее — по кругу не гоняем,
   на краях стрелки просто гаснут.                                 */
(function () {
  var lb    = document.getElementById('lb');
  var img   = document.getElementById('lbImg');
  var cap   = document.getElementById('lbCap');
  var btnX  = document.getElementById('lbClose');
  var btnP  = document.getElementById('lbPrev');
  var btnN  = document.getElementById('lbNext');
  if (!lb || !img) return;

  var links = Array.prototype.slice.call(document.querySelectorAll('a.zoom'));
  if (!links.length) return;

  /* Один и тот же лист лежит и в карусели, и в галерее — в окне
     он должен встретиться один раз, иначе стрелки крутят дубли. */
  var list = [], seen = {};
  links.forEach(function (a) {
    var src = a.getAttribute('href');
    if (seen[src]) return;
    seen[src] = true;
    var im = a.querySelector('img');
    list.push({ src: src, alt: im ? im.getAttribute('alt') || '' : '' });
  });

  var i = 0, opener = null;

  function draw() {
    img.src = list[i].src;
    img.alt = list[i].alt;
    cap.textContent = list[i].alt;
    btnP.disabled = i === 0;
    btnN.disabled = i === list.length - 1;
  }

  function open(src, from) {
    for (var k = 0; k < list.length; k++) if (list[k].src === src) { i = k; break; }
    opener = from || null;
    draw();
    lb.removeAttribute('hidden');
    document.body.classList.add('lb-open');
    btnX.focus();
  }

  function close() {
    lb.setAttribute('hidden', '');
    document.body.classList.remove('lb-open');
    img.src = '';                       /* не держим картинку в памяти */
    if (opener) { opener.focus(); opener = null; }
  }

  function step(d) {
    var k = i + d;
    if (k < 0 || k >= list.length) return;
    i = k; draw();
    lb.querySelector('.lb-scroll').scrollLeft = 0;
  }

  links.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      open(a.getAttribute('href'), a);
    });
  });

  btnX.addEventListener('click', close);
  btnP.addEventListener('click', function () { step(-1); });
  btnN.addEventListener('click', function () { step(1); });

  /* Клик мимо картинки закрывает. Проверяем именно цель события:
     клик по самой картинке всплывает сюда же. */
  lb.addEventListener('click', function (e) {
    if (e.target === lb) close();
  });

  document.addEventListener('keydown', function (e) {
    if (lb.hasAttribute('hidden')) return;
    if (e.key === 'Escape')     { e.preventDefault(); close(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
  });
})();

/* ─── 17. ПОЛОСА ПРОЧТЕНИЯ ────────────────────────────────────────
   Считаем долю прокрутки от всей прокручиваемой высоты. Обновляем
   через requestAnimationFrame: на событие scroll браузер зовёт нас
   десятки раз в секунду, и без этого страница начинает подтормаживать
   на слабых телефонах.                                            */
(function () {
  var бар = document.getElementById('progress');
  if (!бар) return;
  var линия = бар.firstElementChild, ждём = false;

  function считать() {
    var h = document.documentElement;
    var всего = (h.scrollHeight - h.clientHeight) || 1;
    var доля = Math.min(1, Math.max(0, (window.pageYOffset || h.scrollTop) / всего));
    линия.style.width = (доля * 100).toFixed(2) + '%';
    ждём = false;
  }
  window.addEventListener('scroll', function () {
    if (ждём) return;
    ждём = true;
    window.requestAnimationFrame ? requestAnimationFrame(считать) : считать();
  }, { passive: true });
  window.addEventListener('resize', считать, { passive: true });
  считать();
})();

/* ─── 18. СЧЁТЧИКИ ЦИФР ───────────────────────────────────────────
   Цифра досчитывается от нуля, когда блок появляется на экране.
   Считаем один раз: повторный отсчёт при каждой прокрутке туда-сюда
   раздражает. Если IntersectionObserver не поддерживается или
   человек просил меньше движения — просто ставим итоговое число. */
(function () {
  var цифры = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  if (!цифры.length) return;

  var меньшеДвижения = window.matchMedia &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function сразу(el) { el.textContent = el.getAttribute('data-count'); }

  if (меньшеДвижения || !window.IntersectionObserver) {
    цифры.forEach(сразу);
    return;
  }

  function считать(el) {
    var цель = parseInt(el.getAttribute('data-count'), 10);
    if (isNaN(цель)) { сразу(el); return; }
    var шагов = 34, i = 0;
    var таймер = setInterval(function () {
      i++;
      /* Замедление к концу — так живее, чем ровный отсчёт */
      var t = 1 - Math.pow(1 - i / шагов, 3);
      el.textContent = Math.round(цель * t);
      if (i >= шагов) { clearInterval(таймер); el.textContent = цель; }
    }, 22);
  }

  var набл = new IntersectionObserver(function (записи) {
    записи.forEach(function (з) {
      if (!з.isIntersecting) return;
      считать(з.target);
      набл.unobserve(з.target);     /* каждый считается один раз */
    });
  }, { threshold: 0.6 });

  цифры.forEach(function (el) { набл.observe(el); });
})();
