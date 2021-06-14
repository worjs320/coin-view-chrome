var url = 'https://api.upbit.com/v1/market/all';
var globalData;
fetch(url)
  .then((response) => response.json())
  .then((data) => init(data));

function createTable(jsonData) {
  var col = ['', '마켓', '현재가', '전일대비', '거래대금', '알림'];

  var tableHeader = document.createElement('table');
  tableHeader.id = 'coinHeader';
  tableHeader.innerHTML =
    '<colgroup><col width="25px"><col width="22%"/><col width="55px"/><col width="60px"/><col width="25%"/><col width="25px"/></colgroup>';

  var thead = tableHeader.createTHead(); // TABLE ROW.
  var sort = localStorage.getItem('sort')
    ? localStorage.getItem('sort')
    : 'down';
  var sortItem = localStorage.getItem('sortItem')
    ? localStorage.getItem('sortItem')
    : 'acc_trade_price_24h';

  for (var i = 1; i < col.length; i++) {
    var th = document.createElement('th'); // TABLE HEADER.
    if (i == 1) {
      th.colSpan = 2;
      th.innerHTML = col[i] + ' <i class="fas fa-exchange-alt"></i>';
    } else if (i > 1) {
      if (i == getSortIndexBySortItem(sortItem)) {
        th.innerHTML = col[i] + ' <i class="fas fa-sort-' + sort + '"></i>';
      } else if (i < col.length - 1) {
        th.innerHTML = col[i] + ' <i class="fas fa-sort"></i>';
      } else {
        th.innerHTML = col[i];
      }
    }
    if (i >= 3 && i < col.length - 1) th.style = 'text-align:right';
    thead.appendChild(th);
  }
  function getSortIndexBySortItem(sortItem) {
    switch (sortItem) {
      case 'trade_price':
        return 2;
      case 'signed_change_rate':
        return 3;
      case 'acc_trade_price_24h':
        return 4;
      default:
        return 0;
    }
  }
  var className = [
    'bookmark',
    'market',
    'trade_price',
    'percent',
    'acc_trade_price_24h',
    'notice',
  ];

  var table = document.createElement('table');
  table.innerHTML =
    '<colgroup><col width="25px"><col width="22%"/><col width="55px"/><col width="60px"/><col width="25%"/><col width="25px"/></colgroup>';
  table.id = 'coinList';
  jsonData.sort(function (a, b) {
    if (sort == 'up') {
      return parseFloat(a[sortItem]) - parseFloat(b[sortItem]);
    } else {
      return parseFloat(b[sortItem]) - parseFloat(a[sortItem]);
    }
  });

  var coinNoticeJson = localStorage.getItem('coinNotice')
    ? JSON.parse(localStorage.getItem('coinNotice'))
    : [];

  for (var i = 0; i < jsonData.length; i++) {
    tr = table.insertRow(-1);
    tr.id = jsonData[i][className[1]];
    var coinBookmarkInfo =
      JSON.parse(localStorage.getItem('coinBookmarkInfo')) || [];
    var checked = '';
    var noticeColor = '';

    for (var j = 0; j < col.length; j++) {
      var tabCell = tr.insertCell(-1);
      if (j == 0) {
        for (var key in coinBookmarkInfo) {
          if (
            coinBookmarkInfo[key].market ==
            jsonData[i][className[1]] + '_bookmark'
          ) {
            checked = 'checked';
            break;
          } else {
            checked = '';
          }
        }
        tabCell.innerHTML =
          '<div class="anim-icon star"><input class="bookmark" type="checkbox" id="' +
          jsonData[i][className[1]] +
          '_bookmark' +
          '"' +
          checked +
          '/><label for="' +
          jsonData[i][className[1]] +
          '_bookmark' +
          '"></label></div>';
      }
      if (j == 1) {
        tabCell.innerHTML =
          '<strong class="' +
          jsonData[i].market +
          '">' +
          '</strong><i class="warning" style="display:none">유의</i><span>' +
          jsonData[i].market.split('-')[1] +
          '/' +
          jsonData[i].market.split('-')[0] +
          '</span>';
      }
      if (j == 3) {
        tabCell.innerHTML =
          '<p class="signed_change_rate"></p><span class="signed_change_price"></span>';
      }
      if (j == col.length - 1) {
        for (var key in coinNoticeJson) {
          if (coinNoticeJson[key].market == jsonData[i][className[1]]) {
            noticeColor = 'yellow';
            break;
          }
        }
        tabCell.innerHTML =
          '<i class="far fa-bell ' +
          noticeColor +
          '" data="' +
          jsonData[i][className[1]] +
          '"></i>';
      }
      tabCell.className = className[j];
    }
  }

  document.getElementById('tableHeader').appendChild(tableHeader);
  document.getElementById('tableBody').appendChild(table);
}

function openUpbitPage() {
  var win = window.open(
    'https://upbit.com/exchange?code=CRIX.UPBIT.' + this.className,
    '_blank'
  );
  win.focus();
}

function init(jsonData) {
  var marketString = '';
  for (i = 0; i < jsonData.length; i++) {
    if (jsonData[i].market.substr(0, 3) != 'KRW') {
      jsonData.splice(i, 1);
      i--;
    }
  }

  for (i = 0; i < jsonData.length; i++) {
    marketString += jsonData[i].market;
    if (i < jsonData.length - 1) marketString += ',';
  }

  globalData = jsonData;
  fetch('https://api.upbit.com/v1/ticker?markets=' + marketString)
    .then((response) => response.json())
    .then((data) => createTable(data))
    .then(() => getMarketName())
    .then(() => customAddEventListener())
    .then(() => webSocketConfig());
}

function getMarketName() {
  var lang = localStorage.getItem('lang');
  if (lang == null) {
    localStorage.setItem('lang', 'korean_name');
    lang = 'korean_name';
  }

  for (var i = 0; i < globalData.length; i++) {
    document
      .getElementById(globalData[i].market)
      .getElementsByClassName(globalData[i].market)[0].innerHTML =
      globalData[i][lang];
  }
}

function setMarketName() {
  var lang = localStorage.getItem('lang');
  if (lang == 'korean_name') {
    lang = 'english_name';
    localStorage.setItem('lang', lang);
  } else if (lang == 'english_name') {
    lang = 'korean_name';
    localStorage.setItem('lang', lang);
  }

  for (var i = 0; i < globalData.length; i++) {
    document
      .getElementById(globalData[i].market)
      .getElementsByClassName(globalData[i].market)[0].innerHTML =
      globalData[i][lang];
  }
}

function webSocketConfig() {
  var wsUri = 'wss://api.upbit.com/websocket/v1';
  websocket = new WebSocket(wsUri);
  websocket.binaryType = 'arraybuffer';

  websocket.onopen = function (evt) {
    onOpen(evt);
  };

  websocket.onclose = function (evt) {
    onClose(evt);
  };

  websocket.onmessage = function (evt) {
    onMessage(evt);
  };

  websocket.onerror = function (evt) {
    onError(evt);
  };
}

function onOpen(evt) {
  var code = [];
  for (i = 0; i < globalData.length; i++) {
    code.push(globalData[i].market);
  }

  var msg = [
    { ticket: 'test' },
    {
      type: 'ticker',
      codes: code,
    },
  ];

  msg = JSON.stringify(msg);
  websocket.send(msg);
}

function onClose() {
  webSocketConfig();
}

function onMessage(evt) {
  var enc = new TextDecoder('utf-8');
  var jsonData = JSON.parse(enc.decode(evt.data));

  var privPrice = document
    .getElementById(jsonData.code)
    .getElementsByClassName('trade_price')[0].textContent;

  document
    .getElementById(jsonData.code)
    .getElementsByClassName('trade_price')[0].innerHTML =
    jsonData.trade_price.toLocaleString();
  document
    .getElementById(jsonData.code)
    .getElementsByClassName('signed_change_rate')[0].innerHTML =
    getPercentNumber(jsonData.signed_change_rate);

  var currentPrice = jsonData.trade_price.toLocaleString();
  if (privPrice != currentPrice && privPrice != '') {
    if (privPrice < currentPrice) {
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('trade_price')[0]
        .classList.remove('price-down');
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('trade_price')[0]
        .classList.add('price-up');
    } else if (privPrice > currentPrice) {
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('trade_price')[0]
        .classList.remove('price-up');
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('trade_price')[0]
        .classList.add('price-down');
    }
  }
  document
    .getElementById(jsonData.code)
    .getElementsByClassName('signed_change_price')[0].innerHTML =
    getPlusMinusNumber(jsonData.signed_change_price);

  document
    .getElementById(jsonData.code)
    .getElementsByClassName('acc_trade_price_24h')[0].innerHTML = getNumberUnit(
    jsonData.acc_trade_price_24h
  );
  document.getElementById(jsonData.code).className = jsonData.change;

  var coinNoticeJson = localStorage.getItem('coinNotice')
    ? JSON.parse(localStorage.getItem('coinNotice'))
    : [];

  for (var key in coinNoticeJson) {
    if (
      coinNoticeJson[key].market == jsonData.code &&
      coinNoticeJson[key].notice != jsonData.trade_price
    ) {
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('notice')[0]
        .getElementsByTagName('i')[0]
        .classList.add('yellow');
      break;
    } else if (
      coinNoticeJson[key].market != jsonData.code ||
      (coinNoticeJson[key].market == jsonData.code &&
        coinNoticeJson[key].notice == jsonData.trade_price)
    ) {
      document
        .getElementById(jsonData.code)
        .getElementsByClassName('notice')[0]
        .getElementsByTagName('i')[0]
        .classList.remove('yellow');
    }
  }

  if (coinNoticeJson.length == 0) {
    document
      .getElementById(jsonData.code)
      .getElementsByClassName('notice')[0]
      .getElementsByTagName('i')[0]
      .classList.remove('yellow');
  }

  if (jsonData.market_warning == 'CAUTION') {
    document
      .getElementById(jsonData.code)
      .getElementsByClassName('warning')[0].style.display = 'inline-block';
  } else {
    document
      .getElementById(jsonData.code)
      .getElementsByClassName('warning')[0].style.display = 'none';
  }
}

function getPlusMinusNumber(theNumber) {
  if (theNumber > 0) {
    return (
      '+' +
      theNumber.toLocaleString(navigator.language, {
        maximumFractionDigits: 2,
      })
    );
  } else {
    return theNumber.toLocaleString(navigator.language, {
      maximumFractionDigits: 2,
    });
  }
}

function getNumberUnit(theNumber) {
  var result = theNumber.toLocaleString('ko-KR', {
    maximumFractionDigits: 0,
  });
  if (result.length >= 8)
    result = result.substring(0, result.length - 8) + '백만';
  return result;
}

function getPercentNumber(theNumber) {
  if (theNumber > 0) {
    return '+' + (theNumber * 100).toFixed(2) + '%';
  } else {
    return (theNumber * 100).toFixed(2) + '%';
  }
}

function onError() {
  webSocketConfig();
}

function searchCoin() {
  var input = document.getElementById('searchCoinInput');
  var filter = input.value.toUpperCase();
  var choFilter = cho_hangul(input.value.toUpperCase());
  var table = document.getElementById('coinList');
  var tr = table.getElementsByTagName('tr');
  var searchBookmarkFlag = document.getElementById('searchBookmark').checked;
  var bookmark;

  for (var i = 0; i < tr.length; i++) {
    for (var j = 1; j < 2; j++) {
      td = tr[i].getElementsByTagName('td')[1];
      bookmark = tr[i]
        .getElementsByTagName('td')[0]
        .getElementsByTagName('div')[0]
        .getElementsByTagName('input')[0].checked;
      if (td) {
        txtValue = td.textContent || td.innerText;
        txtChoValue = cho_hangul(td.textContent) || cho_hangul(td.innerText);
        if (
          txtValue.toUpperCase().indexOf(filter) > -1 ||
          (txtChoValue.toUpperCase().indexOf(choFilter) == 0 && isCho(filter))
        ) {
          if (searchBookmarkFlag && bookmark) {
            tr[i].style.display = '';
            break;
          } else if (!searchBookmarkFlag) {
            tr[i].style.display = '';
            break;
          }
        } else {
          tr[i].style.display = 'none';
        }
      }
    }
  }
}

function isCho(str) {
  var pattern = /[ㄱ-ㅎ]/gi;
  return pattern.test(str);
}

function cho_hangul(str) {
  cho = [
    'ㄱ',
    'ㄲ',
    'ㄴ',
    'ㄷ',
    'ㄸ',
    'ㄹ',
    'ㅁ',
    'ㅂ',
    'ㅃ',
    'ㅅ',
    'ㅆ',
    'ㅇ',
    'ㅈ',
    'ㅉ',
    'ㅊ',
    'ㅋ',
    'ㅌ',
    'ㅍ',
    'ㅎ',
  ];
  result = '';
  for (i = 0; i < str.length; i++) {
    code = str.charCodeAt(i) - 44032;
    if (code > -1 && code < 11172) result += cho[Math.floor(code / 588)];
    else result += str.charAt(i);
  }
  return result;
}

function onCheckBookmark() {
  stopColorEvent();
  var el = this;
  if (el.checked == true) {
    var coinBookmarkInfo =
      JSON.parse(localStorage.getItem('coinBookmarkInfo')) || [];
    coinBookmarkInfo.push({ market: el.id });
    localStorage.setItem('coinBookmarkInfo', JSON.stringify(coinBookmarkInfo));
  } else {
    var coinBookmarkInfo =
      JSON.parse(localStorage.getItem('coinBookmarkInfo')) || [];
    for (var key in coinBookmarkInfo) {
      if (coinBookmarkInfo[key].market == el.id) {
        coinBookmarkInfo.splice(key, 1);
      }
    }
    localStorage.setItem('coinBookmarkInfo', JSON.stringify(coinBookmarkInfo));
    if (document.getElementById('searchBookmark').checked == true) {
      document.getElementById(el.id.split('_')[0]).style.display = 'none';
      var onCheckCoinBookmarkInfo =
        JSON.parse(localStorage.getItem('coinBookmarkInfo')) || [];
      if (onCheckCoinBookmarkInfo.length == 0) createNoneBookmarkTextCell();
    }
  }
}

function onCheckBookmarkSearch(el) {
  document.getElementById('searchCoinInput').value = '';
  var input, table, tr, checked, i;
  input = document.getElementById('searchCoinInput');
  table = document.getElementById('coinList');
  tr = table.getElementsByTagName('tr');
  var noneBookmark = true;
  if (el.checked == true) {
    for (i = 0; i < tr.length; i++) {
      checked = tr[i]
        .getElementsByTagName('td')[0]
        .getElementsByTagName('div')[0]
        .getElementsByTagName('input')[0].checked;
      if (checked == true) {
        tr[i].style.display = '';
        noneBookmark = false;
      } else {
        tr[i].style.display = 'none';
      }
    }
    localStorage.setItem('bookmarkStatus', true);
  } else {
    for (i = 0; i < tr.length; i++) {
      tr[i].style.display = '';
    }
    localStorage.removeItem('bookmarkStatus');
  }
  if (noneBookmark && el.checked) {
    createNoneBookmarkTextCell();
  } else if (!el.checked && document.getElementById('noBookmark') != null) {
    document.getElementById('noBookmark').remove();
  }
}

function createNoneBookmarkTextCell() {
  var row = document.getElementById('coinHeader').insertRow(-1);
  var cell = row.insertCell(-1);
  row.id = 'noBookmark';
  cell.colSpan = 6;
  cell.style = 'text-align:center; padding: 30px 0;';
  cell.innerHTML =
    '즐겨찾기한 코인이 없습니다.<br/><a id="showCoinListBtn">코인 목록</a>';
  document
    .getElementById('showCoinListBtn')
    .addEventListener('click', function () {
      onCheckBookmarkSearch({ checked: false });
      document.getElementById('searchBookmark').checked = false;
    });
}

function stopColorEvent() {
  for (
    var i = 0;
    i < document.getElementsByClassName('trade_price').length;
    i++
  ) {
    document
      .getElementsByClassName('trade_price')
      [i].classList.remove('price-up');
    document
      .getElementsByClassName('trade_price')
      [i].classList.remove('price-down');
  }
}

function customAddEventListener() {
  document
    .getElementById('searchBookmark')
    .addEventListener('click', function () {
      onCheckBookmarkSearch(this);
    });
  document
    .getElementById('searchCoinInput')
    .addEventListener('keyup', searchCoin);
  document
    .getElementById('searchCoinInput')
    .addEventListener('search', searchCoin);
  var checkboxes = document.querySelectorAll(
    'input[type=checkbox][class=bookmark]'
  );

  for (var checkbox of checkboxes) {
    checkbox.addEventListener('change', onCheckBookmark);
  }

  var links = document.querySelectorAll('strong');

  for (var link of links) {
    link.addEventListener('click', openUpbitPage);
  }

  var noticeBtns = document.querySelectorAll('.notice i');

  for (var noticeBtn of noticeBtns) {
    noticeBtn.addEventListener('click', function () {
      openNoticeModal(this);
    });
  }

  function openNoticeModal(el) {
    var coinId = el.getAttribute('data');
    var coinName = document
      .getElementById(coinId)
      .getElementsByClassName('market')[0]
      .getElementsByClassName(coinId)[0].textContent;
    var coinPrice = document
      .getElementById(coinId)
      .getElementsByClassName('trade_price')[0]
      .textContent.replace(/,/g, '');
    var coinNoticeJson = JSON.parse(localStorage.getItem('coinNotice')) || [];
    var coinNoticePrice;
    for (var key in coinNoticeJson) {
      if (coinNoticeJson[key].market == coinId) {
        coinNoticePrice = coinNoticeJson[key].notice;
      }
    }
    var contentString;
    if (coinNoticePrice != undefined) {
      contentString = `※호가 단위에 맞게 가격을 설정해 주세요.
      <div id="current-notice-info">
      <h4 style="margin:4px 0px">현재 설정된 알림 : ${Number(
        coinNoticePrice
      ).toLocaleString()}KRW</h4><button class="remove-notice" id="${coinId}">알림 해제</button></div>`;
    } else {
      contentString = `※ 호가 단위에 맞게 가격을 설정해 주세요.`;
    }
    alertify.defaults.glossary.ok = '설정';
    alertify.defaults.glossary.cancel = '취소';
    alertify.prompt(
      coinName,
      contentString,
      coinPrice,
      function (evt, value) {
        if (isNaN(value) || value <= 0) {
          alertify.set('notifier', 'position', 'top-center');
          alertify.error('알림 가격이 비정상적입니다.', 2);
          evt.cancel = true;
          return;
        }
        if (value >= 1000000000) {
          alertify.set('notifier', 'position', 'top-center');
          alertify.error(
            '알림 가격이 비정상적입니다. 10억 이하로 설정해 주세요.',
            2
          );
          evt.cancel = true;
          return;
        }
        var coinNoticeJson =
          JSON.parse(localStorage.getItem('coinNotice')) || [];
        for (var key in coinNoticeJson) {
          if (coinNoticeJson[key].market == coinId) {
            coinNoticeJson.splice(key, 1);
          }
        }
        coinNoticeJson.push({ market: coinId, notice: value });
        localStorage.setItem('coinNotice', JSON.stringify(coinNoticeJson));
        alertify.set('notifier', 'position', 'top-center');
        alertify.message(
          `<h2>지정가 알림 설정<br/></h2><h3>${coinName} : ${Number(
            value
          ).toLocaleString()}KRW</h3>`,
          2
        );
        document
          .getElementById(coinId)
          .getElementsByClassName('notice')[0]
          .getElementsByTagName('i')[0]
          .classList.add('yellow');
        coinPrice = document
          .getElementById(coinId)
          .getElementsByClassName('trade_price')[0]
          .textContent.replace(/,/g, '');
        if (value == coinPrice) {
          document
            .getElementById(coinId)
            .getElementsByClassName('notice')[0]
            .getElementsByTagName('i')[0]
            .classList.remove('yellow');
        }
        chrome.runtime.sendMessage('');
      },
      function () {}
    );
    if (document.getElementsByClassName('remove-notice')[0] != undefined) {
      document
        .getElementsByClassName('remove-notice')[0]
        .addEventListener('click', function () {
          removeNotice(this);
        });
    }
  }

  function removeNotice(el) {
    if (document.getElementById('current-notice-info') != undefined) {
      document.getElementById('current-notice-info').remove();
    }
    var coinNoticeJson = JSON.parse(localStorage.getItem('coinNotice')) || [];
    for (var key in coinNoticeJson) {
      if (coinNoticeJson[key].market == el.id) {
        coinNoticeJson.splice(key, 1);
      }
    }
    document
      .getElementById(el.id)
      .getElementsByClassName('notice')[0]
      .getElementsByTagName('i')[0]
      .classList.remove('yellow');
    localStorage.setItem('coinNotice', JSON.stringify(coinNoticeJson));
  }

  var bookmarkStatus =
    JSON.parse(localStorage.getItem('bookmarkStatus')) || false;
  if (bookmarkStatus) {
    document.getElementById('searchBookmark').checked = true;
    var eventFocus = new Event('click');
    document.getElementById('searchBookmark').dispatchEvent(eventFocus);
  }

  var myTable = document.getElementById('coinList');
  var replace = replacement(myTable);
  function sortTD(index) {
    stopColorEvent();
    replace.ascending(index);
  }
  function reverseTD(index) {
    stopColorEvent();
    replace.descending(index);
  }

  function setSort(thisObj, index) {
    for (var i = 0; i < document.getElementsByTagName('th').length - 1; i++) {
      if (i != index - 1 && i != 0)
        document
          .getElementsByTagName('th')
          [i].getElementsByTagName('i')[0].className = 'fas fa-sort';
    }
    if (thisObj.getElementsByTagName('i')[0].classList.contains('fa-sort-up')) {
      reverseTD(index);
      thisObj
        .getElementsByTagName('i')[0]
        .classList.replace('fa-sort-up', 'fa-sort-down');
      localStorage.setItem('sort', 'down');
      localStorage.setItem('sortItem', getSortItemByIndex(index));
    } else if (
      thisObj.getElementsByTagName('i')[0].classList.contains('fa-sort-down')
    ) {
      sortTD(index);
      thisObj
        .getElementsByTagName('i')[0]
        .classList.replace('fa-sort-down', 'fa-sort-up');
      localStorage.setItem('sort', 'up');
      localStorage.setItem('sortItem', getSortItemByIndex(index));
    } else {
      reverseTD(index);
      thisObj
        .getElementsByTagName('i')[0]
        .classList.replace('fa-sort', 'fa-sort-down');
      localStorage.setItem('sort', 'down');
      localStorage.setItem('sortItem', getSortItemByIndex(index));
    }
  }

  function getSortItemByIndex(index) {
    switch (index) {
      case 2:
        return 'trade_price';
      case 3:
        return 'signed_change_rate';
      case 4:
        return 'acc_trade_price_24h';
      default:
        return 'none';
    }
  }

  document.getElementsByTagName('th')[0].addEventListener('click', function () {
    setMarketName();
  });
  document.getElementsByTagName('th')[1].addEventListener('click', function () {
    var thisObj = this;
    setSort(thisObj, 2);
  });
  document.getElementsByTagName('th')[2].addEventListener('click', function () {
    var thisObj = this;
    setSort(thisObj, 3);
  });
  document.getElementsByTagName('th')[3].addEventListener('click', function () {
    var thisObj = this;
    setSort(thisObj, 4);
  });
  SimpleScrollbar.initEl(document.querySelector('#tableBody'));
}

function colorModePreview(ele) {
  if (ele.checked == true) {
    localStorage.setItem('color-theme', 'dark');
    document.getElementsByTagName('body')[0].classList = 'dark-preview';
  } else {
    localStorage.setItem('color-theme', 'light');
    document.getElementsByTagName('body')[0].classList = 'white-preview';
  }
}

window.onload = function () {
  var isUserColorTheme = localStorage.getItem('color-theme');
  var isOsColorTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

  var getUserTheme = isUserColorTheme ? isUserColorTheme : isOsColorTheme;

  if (getUserTheme === 'dark') {
    document.getElementsByClassName('btn-container')[0].innerHTML =
      '<i class="fa fa-sun-o" aria-hidden="true"></i>' +
      '<label id="btn-color-mode-switch" class="switch btn-color-mode-switch">' +
      '<input type="checkbox" name="color_mode" id="color_mode" value="1" checked/>' +
      '<label for="color_mode" class="btn-color-mode-switch-inner"></label></label>' +
      '<i class="fa fa-moon-o" aria-hidden="true"></i>';
    localStorage.setItem('color-theme', 'dark');
    document.documentElement.setAttribute('color-theme', 'dark');
    document.getElementsByTagName('body')[0].classList = 'dark-preview';
  } else {
    document.getElementsByClassName('btn-container')[0].innerHTML =
      '<i class="fa fa-sun-o" aria-hidden="true"></i>' +
      '<label id="btn-color-mode-switch" class="switch btn-color-mode-switch">' +
      '<input type="checkbox" name="color_mode" id="color_mode" value="1" />' +
      '<label for="color_mode" class="btn-color-mode-switch-inner"></label></label>' +
      '<i class="fa fa-moon-o" aria-hidden="true"></i>';
    localStorage.setItem('color-theme', 'light');
    document.documentElement.setAttribute('color-theme', 'light');
    document.getElementsByTagName('body')[0].classList = 'white-preview';
  }
  document.getElementById('color_mode').addEventListener('change', function () {
    colorModePreview(this);
  });

  var coinNotice = localStorage.getItem('coinNotice');
  if (coinNotice == null) {
    localStorage.setItem('coinNotice', '[]');
  }

  document.getElementById('searchCoinInput').focus();
};
