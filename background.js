var globalData = [];
var websocket;
var locale = 'ko-KR';
const getObjectFromLocalStorage = async function (key) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.get(key, function (value) {
        resolve(value[key]);
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

const saveObjectInLocalStorage = async function (obj) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.sync.set(obj, function () {
        resolve();
      });
    } catch (ex) {
      reject(ex);
    }
  });
};

// init();
async function init() {
  if (websocket != undefined) websocket.close();
  globalData = [];
  var marketString = '';
  var coinNoticeJson = (await getObjectFromLocalStorage('coinNotice')) || [];
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

function getTradePriceNumber(theNumber, marketMode) {
  var minCount = 0;
  var maxCount = 20;
  if (theNumber >= 10) {
    maxCount = 3;
  } else if (theNumber > 1) {
    minCount = 2;
    maxCount = 3;
  } else if (theNumber > 0.1) {
    minCount = 4;
  } else if (theNumber > 0.1 || marketMode == 'KRW') {
    minCount = 4;
  } else {
    minCount = 8;
  }
  return theNumber.toLocaleString(locale, {
    minimumFractionDigits: minCount,
    maximumFractionDigits: maxCount,
  });
}

async function onMessage(evt) {
  var enc = new TextDecoder('utf-8');
  var jsonData = JSON.parse(enc.decode(evt.data));
  var coinNoticeJson = (await getObjectFromLocalStorage('coinNotice')) || [];
  for (var key in coinNoticeJson) {
    if (coinNoticeJson[key].market == jsonData.code && coinNoticeJson[key].notice == jsonData.trade_price) {
      var currentTime = new Date();
      chrome.notifications.create('', {
        title: `지정가 도달\n${jsonData.code.split('-')[1]}/${jsonData.code.split('-')[0]}: ${getTradePriceNumber(jsonData.trade_price, jsonData.code.split('-')[0])} ${jsonData.code.split('-')[0]} `,
        message: `${currentTime.toLocaleTimeString()}`,
        iconUrl: '/barak_icon_128px.png',
        type: 'basic',
      });
      for (var key in coinNoticeJson) {
        if (coinNoticeJson[key].market == jsonData.code) {
          coinNoticeJson.splice(key, 1);
        }
      }
      await saveObjectInLocalStorage({
        coinNotice: coinNoticeJson,
      });
      init();
    }
  }
}

chrome.runtime.onMessage.addListener(() => {
  init();
});
