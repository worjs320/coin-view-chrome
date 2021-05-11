var globalData = [];
var websocket;
init();
function init() {
  globalData = [];
  var marketString = '';
  var coinNoticeJson = localStorage.getItem('coinNotice')
    ? JSON.parse(localStorage.getItem('coinNotice'))
    : [];
  if (coinNoticeJson.length == 0) {
    return;
  }
  for (i = 0; i < coinNoticeJson.length; i++) {
    marketString += coinNoticeJson[i].market;
    if (i < coinNoticeJson.length - 1) marketString += ',';
    globalData.push(coinNoticeJson[i].market);
  }

  fetch('https://api.upbit.com/v1/ticker?markets=' + marketString)
    .then((response) => response.json())
    .then(() => webSocketConfig());
}

function webSocketConfig() {
  if (websocket != undefined) websocket.close();
  var wsUri = 'wss://api.upbit.com/websocket/v1';
  websocket = new WebSocket(wsUri);
  websocket.binaryType = 'arraybuffer';

  websocket.onopen = function () {
    onOpen();
  };

  websocket.onmessage = function (evt) {
    onMessage(evt);
  };

  websocket.onclose = function () {};

  websocket.onerror = function () {};
}

function onOpen() {
  var msg = [
    { ticket: 'test' },
    {
      type: 'ticker',
      codes: globalData,
    },
  ];

  msg = JSON.stringify(msg);
  websocket.send(msg);
}

function onMessage(evt) {
  var enc = new TextDecoder('utf-8');
  var arr = new Uint8Array(evt.data);
  var jsonData = JSON.parse(enc.decode(arr));
  var coinNoticeJson = localStorage.getItem('coinNotice')
    ? JSON.parse(localStorage.getItem('coinNotice'))
    : [];
  for (var key in coinNoticeJson) {
    if (
      coinNoticeJson[key].market == jsonData.code &&
      coinNoticeJson[key]?.notice
        ?.split(',')
        ?.includes(String(jsonData.trade_price))
    ) {
      chrome.tabs.create({ url: 'index.html' });
    }
  }
}

chrome.runtime.onMessage.addListener(() => {
  init();
  return true;
});
