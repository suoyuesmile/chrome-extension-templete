console.log('这是content script!')
// 注意，必须设置了run_at=document_start 此段代码才会生效
// 接收后台的消息
window.onload = function() {
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.cmd == 'getInnerText') {
      sendResponse(document.body.innerText)
    } else if (request.cmd == 'posWord') {
      var response = initCustomPanel(request.items)
      sendResponse(response)
    } else if (request.cmd == 'posPage') {
      // console.log(2);

      posPage(request.id)
    }
  })
}
document.addEventListener('DOMContentLoaded', function() {})

function posPage(id) {
  var element = $('#' + id)
  var height = $(window).height()
  // console.log(height);
  // console.log(element.position().top);
  if (element.position().top >= height) {
    $('body, html').scrollTop(element.position().top - (1 / 2) * height + 80)
  }
}

function initCustomPanel(items) {
  // console.log(items);
  $('#page-title').hover(
    function() {
      $(this).append($('<span>123</span>'))
    },
    function() {
      $(this)
        .find('span')
        .remove()
    }
  )

  var content = document.body.innerHTML

  var record = wordHightlight(content, items, 'red')

  function wordHightlight(content, items, bgColor) {
    var regString = ''
    var count = 1
    var record = []

    for (var i = 0, len = items.length; i < len; i++) {
      regString +=
        i === len - 1
          ? `${items[i].sense_word}(?=([^<>]*?<))`
          : `${items[i].sense_word}(?=([^<>]*?<))|`
    }
    console.log(regString)
    var reg = RegExp(regString, 'gi')
    // 记录每个敏感词对应的id
    // 替换内容
    var result = content.replace(reg, match => {
      var str = ''
      var wordId = `sensitive${count}`
      var whichItem = items.find(item => item.sense_word === match)
      var itemLabel = whichItem ? whichItem.sense_type : ''
      record.push({ word: match, id: wordId, label: itemLabel })
      // console.log(record);
      str = `<span id="${wordId}" class="sen-word" style="background-color: #FFBB00;" aria-controls="${itemLabel}">${match}</span>&zwj;`
      // 下一个敏感词对应的id+1
      count++
      return str
    })
    // 查找改词所在的句子
    var textContent = content.replace(/(<[^>]+>)|(&.+?;)|(\u200d)/gi, '')
    var startIndex = 0
    for (var item of record) {
      var word = item.word
      var findIndex = textContent.indexOf(word, startIndex)
      if (findIndex >= 0) {
        var sliceStart = findIndex - 15 <= 0 ? 0 : findIndex - 15
        var sliceEnd =
          findIndex + word.length + 15 >= textContent.length
            ? undefined
            : findIndex + word.length + 15
        item.sentence = textContent.slice(sliceStart, sliceEnd)
        startIndex = findIndex + word.length
      }
    }

    document.body.innerHTML = result

    return record
  }
  return record
}

// 向页面注入JS
function injectCustomJs(jsPath) {
  var pageText = document.body.innerText
  jsPath = jsPath || 'js/inject.js'
  var temp = document.createElement('script')
  temp.setAttribute('type', 'text/javascript')
  // 获得的地址类似：chrome-extension://ihcokhadfjfchaeagdoclpnjdiokfakg/js/inject.js
  temp.src = chrome.extension.getURL(jsPath)
  temp.onload = function() {
    // 放在页面不好看，执行完后移除掉
    this.parentNode.removeChild(this)
  }
  document.body.appendChild(temp)
  return pageText
}

// 接收来自后台的消息

// 主动发送消息给后台
// 要演示此功能，请打开控制台主动执行sendMessageToBackground()
function sendMessageToBackground(message) {
  chrome.runtime.sendMessage(
    { greeting: message || '你好，我是content-script呀，我主动发消息给后台！' },
    function(response) {
      // tip('收到来自后台的回复：' + response);
      // console.log(response)
    }
  )
}

// 监听长连接
chrome.runtime.onConnect.addListener(function(port) {
  // console.log(port);
  if (port.name == 'test-connect') {
    port.onMessage.addListener(function(msg) {
      console.log('收到长连接消息：', msg)
      tip('收到长连接消息：' + JSON.stringify(msg))
      if (msg.question == '你是谁啊？')
        port.postMessage({ answer: '我是你爸！' })
    })
  }
})

window.addEventListener(
  'message',
  function(e) {
    // alert(e);
    // sendMessageToBackground(document.body.innerText);
  },
  false
)

function initCustomEventListen() {
  var hiddenDiv = document.getElementById('myCustomEventDiv')
  if (!hiddenDiv) {
    hiddenDiv = document.createElement('div')
    hiddenDiv.style.display = 'none'
    hiddenDiv.id = 'myCustomEventDiv'
    document.body.appendChild(hiddenDiv)
  }
  hiddenDiv.addEventListener('myCustomEvent', function() {
    var eventData = document.getElementById('myCustomEventDiv').innerText
    tip('收到自定义事件：' + eventData)
  })
}

var tipCount = 0
// 简单的消息通知
function tip(info) {
  info = info || ''
  var ele = document.createElement('div')
  ele.className = 'chrome-plugin-simple-tip slideInLeft'
  ele.style.top = tipCount * 70 + 20 + 'px'
  ele.innerHTML = `<div>${info}</div>`
  document.body.appendChild(ele)
  ele.classList.add('animated')
  tipCount++
  setTimeout(() => {
    ele.style.top = '-100px'
    setTimeout(() => {
      ele.remove()
      tipCount--
    }, 400)
  }, 3000)
}
