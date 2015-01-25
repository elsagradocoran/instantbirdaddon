/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this file,
* You can obtain one at http://mozilla.org/MPL/2.0/. */

let {interfaces: Ci, utils: Cu, classes: Cc} = Components;
Cu.import("resource:///modules/imServices.jsm");
let addon = {
  _quran: new Array(),
  kQuranCommand: 'coran',
  LOG: function(aMsg) {
    if (debug)
      Services.console.logStringMessage(aMsg);
  },  
  ERROR: function(aMsg) {
    Cu.reportError(aMsg)
  },
  getResourceURI: function(filePath) ({
    spec: __SCRIPT_URI_SPEC__ + "/../" + filePath
  }),
  xhr: function(url, cb) {
    let xhr = Cc["@mozilla.org/xmlextras/xmlhttprequest;1"].createInstance(Ci.nsIXMLHttpRequest);
    let handler = ev => {
      evf(m => xhr.removeEventListener(m, handler, !1));
      switch (ev.type) {
          case 'load':
              if (xhr.status == 200) {
                  cb(xhr.response);
                  break;
              }
          default:
              this.ERROR('XHR Error\nError Fetching Package: ' + xhr.statusText + ' [' + ev.type + ':' + xhr.status + ']');
              break;
      }
    };
    let evf = f => ['load', 'error', 'abort'].forEach(f);
    evf(m => xhr.addEventListener(m, handler, false));
    xhr.mozBackgroundRequest = true;
    xhr.open('GET', url, true);
    xhr.setRequestHeader('Acept', 'text/plain');
    xhr.setRequestHeader('Content-Type', 'text/plain');
    xhr.channel.loadFlags |= Ci.nsIRequest.LOAD_ANONYMOUS | Ci.nsIRequest.LOAD_BYPASS_CACHE | Ci.nsIRequest.INHIBIT_PERSISTENT_CACHING;
    xhr.responseType = "text";
    xhr.send(null);
  },
  init: function() {
    Services.cmd.registerCommand({
      name: this.kQuranCommand,
      get helpString() 'Herramienta para seleccionar r\xE1pidamente un vers\xEDculo del cor\xE1n y enviarlo v\xEDa IM (Mensajer\xEDa Instantanea).',
      usageContext: Ci.imICommand.CMD_CONTEXT_ALL,
      priority: Ci.imICommand.CMD_PRIORITY_HIGH,
      run: (function(aMsg, aConv) {
        let conv = aConv.wrappedJSObject;
        let search = aMsg.split(":");
        if (typeof this._quran[search[0]] === 'undefined') {
          for (chapter=0;chapter<115;chapter++) {
            this._quran[chapter]=new Array();
          } 
          this.xhr(this.getResourceURI("es.garcia.txt").spec, data => {
            let result = data.split(/\r?\n/);
            result.forEach(function (currentValue){
              let parts = currentValue.split("|");
              if (typeof parts[0] === 'undefined' || 
                  typeof parts[1] === 'undefined' || 
                  typeof parts[2] === 'undefined')
                return true;
              this._quran[parts[0]][parts[1]] = parts[2];
            }, this)
            sendVerse.call(this);
          });
        }else
          sendVerse.call(this);
        function sendVerse(){
          if (typeof search[0] === 'undefined' || 
              typeof search[1] === 'undefined' ||
              typeof this._quran[search[0]] === 'undefined' || 
              typeof this._quran[search[0]][search[1]] === 'undefined'){
            conv.writeMessage('quran', 'Modo de uso: /coran 114:1',
                            {system: true, noLog: true});
          } else
          conv.sendMsg(this._quran[search[0]][search[1]]);
        }
        return true;
      }).bind(this)
    });
  }
}

function startup(aData, aReason) {
  let mObserver = {
    observe: function(subject, topic, data) {
      window = Services.wm.getMostRecentWindow("Messenger:convs");
      if (!window) {
        return;
      }
      addon.init();
      Services.obs.removeObserver(this, "toplevel-window-ready");
      Services.obs.removeObserver(this, "xul-window-visible", false);
    }
  }
  window = Services.wm.getMostRecentWindow("Messenger:convs");
  if (!window) {
    Services.obs.addObserver(mObserver, "toplevel-window-ready", false);
    Services.obs.addObserver(mObserver, "xul-window-visible", false);
  }
  else
    addon.init();
}

function shutdown(aData, aReason) {
  try {
    Services.cmd.unregisterCommand(addon.kQuranCommand);
  } catch (e) {
    addon.ERROR(e);
  }
}

function install(aData, aReason) {}

function uninstall(aData, aReason) {
  delete addon;
}