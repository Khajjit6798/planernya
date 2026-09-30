/* ══════════════════════════════════════════════════════════════════
   ВЕРНУЛСЯ, НЕ ЗАПЛАТИВ
   ══════════════════════════════════════════════════════════════════
   Человек нажал «Оплатить», ушёл на Робокассу — и вернулся назад.
   Причин обычно немного: не понял, чем платить; засомневался
   в цене; не нашёл нужного способа; просто передумал. Молча
   отпускать такого человека жалко: он уже был готов купить.

   Что делает этот файл: при уходе на оплату ставит метку, а когда
   человек снова открывает страницу сайта — показывает короткое
   окно с вопросом и кнопкой связаться.

   Метка живёт в sessionStorage, то есть только в этой вкладке
   и до её закрытия. Страница успеха метку снимает — значит после
   удачной оплаты окно не выскочит.

   Окно собирается прямо здесь, в разметке страниц его нет:
   иначе пришлось бы держать одинаковый кусок HTML в двух файлах
   и следить, чтобы они не разъехались.
   ══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var МЕТКА = 'og_pay_started';
  var ПОКАЗАНО = 'og_back_shown';

  var СВЯЗЬ = {
    telegram: 'https://t.me/ogdailyplanners',
    mail    : 'pophalo90@gmail.com',

    /* Formspree принимает отправку с сайта и пересылает её письмом.
       Тот же адрес, что у формы «Остались вопросы» в script.js —
       заявки сойдутся в одном ящике, и ничего не потеряется. */
    forma   : 'https://formspree.io/f/mbglqzly'
  };

  /* Сколько ждём возврата. Дольше часа — человек уже занят другим,
     и окно будет выглядеть как приставание. */
  var ЖИВЁТ_МИНУТ = 60;

  /* ─── 1. СТАВИМ МЕТКУ ПРИ УХОДЕ НА ОПЛАТУ ───────────────────────
     Ловим не клик по кнопке, а сам факт ухода со страницы: так
     метка встанет при любом способе перехода, включая тот,
     где ссылку открывает скрипт.                                  */
  var payBtn = document.getElementById('payBtn');
  if (payBtn) {
    payBtn.addEventListener('click', function () {
      /* Ставим с небольшой задержкой: если проверка полей не прошла,
         перехода не будет и метку ставить незачем. */
      setTimeout(function () {
        if (!location.href.match(/checkout/)) return;
        try { sessionStorage.setItem(МЕТКА, String(Date.now())); } catch (e) {}
      }, 400);
    });
  }

  /* ─── 2. СНИМАЕМ МЕТКУ НА СТРАНИЦЕ УСПЕХА ────────────────────── */
  if (document.body && document.body.classList.contains('ok-page')) {
    try {
      sessionStorage.removeItem(МЕТКА);
      sessionStorage.removeItem(ПОКАЗАНО);
    } catch (e) {}
    return;
  }

  /* ─── 3. ПРОВЕРЯЕМ, НАДО ЛИ СПРОСИТЬ ────────────────────────── */
  function пораСпросить() {
    var t = null, показано = null;
    try {
      t = sessionStorage.getItem(МЕТКА);
      показано = sessionStorage.getItem(ПОКАЗАНО);
    } catch (e) { return false; }

    if (!t || показано) return false;

    var прошло = (Date.now() - Number(t)) / 60000;
    /* Меньше пяти секунд — это ещё не «вернулся», а сам переход:
       браузер успевает показать старую страницу из кэша. */
    return прошло > 0.08 && прошло < ЖИВЁТ_МИНУТ;
  }

  /* pageshow вместо load: при возврате кнопкой «назад» страница
     достаётся из кэша браузера, и load второй раз не случается. */
  window.addEventListener('pageshow', function () {
    if (пораСпросить()) setTimeout(показать, 700);
  });

  /* ─── 4. ОКНО ───────────────────────────────────────────────── */
  function показать() {
    try { sessionStorage.setItem(ПОКАЗАНО, '1'); } catch (e) {}

    var фон = document.createElement('div');
    фон.className = 'back-ask';
    фон.setAttribute('role', 'dialog');
    фон.setAttribute('aria-modal', 'true');
    фон.setAttribute('aria-label', 'Что-то помешало оплатить?');

    фон.innerHTML =
      '<div class="back-box">' +
        '<button class="back-x" aria-label="Закрыть">×</button>' +
        '<h3>Что-то помешало?</h3>' +
        '<p>Ты дошёл до оплаты и вернулся. Если дело в нас — ' +
           'скажи в двух словах, поправим. Отвечаем в тот же день.</p>' +
        '<div class="back-tags">' +
          '<button type="button" data-r="не нашёл нужный способ оплаты">Не тот способ оплаты</button>' +
          '<button type="button" data-r="дорого">Дорого</button>' +
          '<button type="button" data-r="не понял, что именно получу">Не понял, что получу</button>' +
          '<button type="button" data-r="страница оплаты не открылась или выдала ошибку">Ошибка при оплате</button>' +
          '<button type="button" data-r="хочу подумать">Просто думаю</button>' +
        '</div>' +
        '<textarea class="back-txt" rows="2" ' +
          'placeholder="Можно дописать своими словами"></textarea>' +
        '<div class="back-btns">' +
          '<button type="button" class="btn btn-1 back-ok">Отправить</button>' +
          '<a class="btn btn-2 back-send" href="#">Написать в телеграм</a>' +
        '</div>' +
        '<button type="button" class="back-skip">Спасибо, просто смотрю</button>' +
      '</div>';

    document.body.appendChild(фон);
    requestAnimationFrame(function () { фон.classList.add('on'); });

    var поле  = фон.querySelector('.back-txt');
    var теги  = Array.prototype.slice.call(фон.querySelectorAll('.back-tags button'));
    var выбор = [];

    теги.forEach(function (b) {
      b.addEventListener('click', function () {
        var r = b.getAttribute('data-r');
        var i = выбор.indexOf(r);
        if (i > -1) { выбор.splice(i, 1); b.classList.remove('on'); }
        else { выбор.push(r); b.classList.add('on'); }
        обновить();
      });
    });
    поле.addEventListener('input', обновить);

    function текст() {
      var s = 'Не смог оплатить на сайте.';
      if (выбор.length) s += '\nПричина: ' + выбор.join('; ') + '.';
      var своё = поле.value.trim();
      if (своё) s += '\nКомментарий: ' + своё;
      return s;
    }

    function обновить() {
      фон.querySelector('.back-send').href =
        СВЯЗЬ.telegram + '?text=' + encodeURIComponent(текст());
    }
    обновить();

    фон.querySelector('.back-send').setAttribute('target', '_blank');
    фон.querySelector('.back-send').setAttribute('rel', 'noopener');

    /* ─── Отправка через Formspree ─────────────────────────────
       Кнопка «Отправить» уводит сообщение сразу, не заставляя
       человека открывать телеграм или почтовую программу.
       Если сервис не ответил — не теряем написанное и открываем
       почту с уже готовым письмом.                             */
    var кнопка = фон.querySelector('.back-ok');
    кнопка.addEventListener('click', function () {
      if (!выбор.length && !поле.value.trim()) {
        поле.focus();
        поле.setAttribute('placeholder', 'Выбери причину или напиши своими словами');
        return;
      }

      var было = кнопка.textContent;
      кнопка.disabled = true;
      кнопка.textContent = 'Отправляем…';

      var xhr = new XMLHttpRequest();
      xhr.open('POST', СВЯЗЬ.forma, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.setRequestHeader('Accept', 'application/json');

      xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) спасибо();
        else почтой(было);
      };
      xhr.onerror = function () { почтой(было); };

      xhr.send(JSON.stringify({
        _subject: 'Ушёл с оплаты · planernya.ru',
        причина : выбор.join('; ') || '—',
        комментарий: поле.value.trim() || '—',
        страница: location.href
      }));
    });

    function спасибо() {
      var box = фон.querySelector('.back-box');
      box.innerHTML =
        '<h3>Спасибо, получили</h3>' +
        '<p>Ответим сегодня. Если что-то срочное — пиши в ' +
        '<a href="' + СВЯЗЬ.telegram + '" target="_blank" rel="noopener">телеграм</a>.</p>' +
        '<button type="button" class="btn btn-1 back-close2">Закрыть</button>';
      box.querySelector('.back-close2').addEventListener('click', закрыть);
      box.querySelector('.back-close2').focus();
    }

    function почтой(было) {
      кнопка.disabled = false;
      кнопка.textContent = было;
      window.location.href =
        'mailto:' + СВЯЗЬ.mail +
        '?subject=' + encodeURIComponent('Не получилось оплатить на planernya.ru') +
        '&body=' + encodeURIComponent(текст());
    }

    function закрыть() {
      фон.classList.remove('on');
      setTimeout(function () {
        if (фон.parentNode) фон.parentNode.removeChild(фон);
      }, 260);
      document.removeEventListener('keydown', поEsc);
    }
    function поEsc(e) { if (e.key === 'Escape') закрыть(); }

    фон.querySelector('.back-x').addEventListener('click', закрыть);
    фон.querySelector('.back-skip').addEventListener('click', закрыть);
    фон.addEventListener('click', function (e) { if (e.target === фон) закрыть(); });
    document.addEventListener('keydown', поEsc);

    /* Ушёл в телеграм — разговор начат, окно можно убрать */
    фон.querySelector('.back-send').addEventListener('click', function () {
      setTimeout(закрыть, 200);
    });

    фон.querySelector('.back-x').focus();
  }
})();
