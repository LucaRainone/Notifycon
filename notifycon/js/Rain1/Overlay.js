    // http://developer.chrome.com/extensions/tabs.htm
!function(root,undef) {
    var CTabs = chrome.tabs;

    root.Rain1Overlay = function (context) {
        if("|popup|content|pageaction|background".indexOf(context) == -1 ) {
            _error("context unknown ("+context+")")
        }
        this.debug = false;

        /**
         * shortcut internalization
         */
        this._ = function(text) {
            return chrome.i18n.getMessage(text) || text;
        };
        /**
         * translate html
         */
        this.translate = function() {
            var toTranslate = document.querySelectorAll('.i18n');
            for (var i = 0; i < toTranslate.length; i++) {
                var el = toTranslate[i];
                el.innerHTML = this._(el.dataset.key) || el.dataset.text;
            }
        };

        /**
         * get the tab active when I trigger the event
         */
        this.getCurrentTab = function(callback) {
            // Doc says: "May be undefined if called from a non-tab context (for example: a background page or popup view)"
            // So in this case I want the active tab in the current window.
            _log("getCurrentTab called");
            var _callback = function(tab) {
                if(tab.length == 1) {
                    callback(new Rain1Overlay.Tab(tab[0]));
                }else if(tab.length == 0) {
                    callback(false);
                }else {
                    _error("More than one tab found in getCurrentTab call");
                }
            };
            if( context == "popup" || context == "background" ) {
                CTabs.query({
                    currentWindow: true,
                    active:true
                } , _callback);
            }else {
                CTabs.getCurrent(_callback);
            }
        };
        this.getStorageOverlay = function() {
            return new Rain1Overlay.Store(context);
        };

        this.openUrl = function(url,callback) {
            CTabs.create({url:url},callback);
        };

        function _error(a) {
            console.error(a);
        }
        function _log(a) {
            if ( this.debug )
                console.log(a);
        }
    };

    Rain1Overlay.Tab = function(tab) {
        this.tab = tab;
    };
    Rain1Overlay.Tab.prototype.hasChromeProtocol = function() {
        return this.tab.url.indexOf("chrome") == 0 || this.tab.url.indexOf("view-source:") == 0
    };
    Rain1Overlay.Tab.prototype.update = function(object) {
        CTabs.update(this.tab.id, object);
    };
    Rain1Overlay.Tab.prototype.togglePin = function() {
        var newState = !this.tab.pinned;
        CTabs.update(this.tab.id, {pinned:newState});
        return newState;
    };

    Rain1Overlay.Store = function(name) {
        this.storage = chrome.storage.local;
    };
    Rain1Overlay.Store.prototype.set = function(object, success) {
        this.storage.set(object,success);
    };
    Rain1Overlay.Store.prototype.get = function(key, onGet) {
        this.storage.get(key,onGet);
    };
    Rain1Overlay.Store.prototype.clearAll = function(onClear) {
        this.storage.clear(onClear);
    };
}(window);