var globalData = [];
var websocket;
init();
function init() {
  if (websocket != undefined) websocket.close();
  globalData = [];
  var marketString = '';
  var coinNoticeJson = localStorage.getItem('coinNotice') ? JSON.parse(localStorage.getItem('coinNotice')) : [];
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
  var wsUri = 'wss://api.upbit.com/websocket/v1';
  websocket = new WebSocket(wsUri);
  websocket.binaryType = 'arraybuffer';

  websocket.onopen = function () {
    onOpen();
  };

  websocket.onmessage = function (evt) {
    onMessage(evt);
  };
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
  var jsonData = JSON.parse(enc.decode(evt.data));
  var coinNoticeJson = localStorage.getItem('coinNotice') ? JSON.parse(localStorage.getItem('coinNotice')) : [];
  for (var key in coinNoticeJson) {
    if (coinNoticeJson[key].market == jsonData.code && coinNoticeJson[key].notice == jsonData.trade_price) {
      var currentTime = new Date();
      chrome.notifications.create('', {
        title: `지정가 도달\n${jsonData.code.split('-')[1]}/${jsonData.code.split('-')[0]}: ${jsonData.trade_price} ${jsonData.code.split('-')[0]} `,
        message: `${currentTime.toLocaleTimeString()}`,
        iconUrl: '/barak_icon_128px.png',
        type: 'basic',
      });
      for (var key in coinNoticeJson) {
        if (coinNoticeJson[key].market == jsonData.code) {
          coinNoticeJson.splice(key, 1);
        }
      }
      localStorage.setItem('coinNotice', JSON.stringify(coinNoticeJson));
      init();
    }
  }
}

chrome.runtime.onMessage.addListener(() => {
  init();
});
