var _port;
function _ensurePort()
{
  if (!_port)
  {
    _port = chrome.runtime.connect();
  }
}
var API = {
  sendMessage: function (message)
  {
    _ensurePort();
    _port.postMessage(message);
  },  
  getURL: chrome.runtime.getURL,
  createTab: function (url, active, selected)
  {
    chrome.tabs.create({ url:url, active:active, selected:selected });
  },
  openSettings: chrome.runtime.openOptionsPage,
  getBackgroundPage: chrome.runtime.getBackgroundPage,
  storage: {
    getLocal: chrome.storage.local.get
  },
  onMessage: function (cb)
  {
    _ensurePort();
    _port.onMessage.addListener(cb)
  }
}
// sendMessage(message:Any):Void
// getURL(localURL:String):String
// createTab(url:String, active:Bool, selected:Bool):Void
// openSettings():Void
// getBackgroundPage():Document
// storage.getLocal(keys:Any, cb:Any->Void):Void
// onMessage(cb:Any->Sender->Void):Void