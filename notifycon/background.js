var o = new Rain1Overlay("background");
var ids = {};
var alreadyReloaded = {};
var disabledDomains = [];

var oStorage = o.getStorageOverlay();

oStorage.get('disabledDomains', function(obj) {
	disabledDomains = obj['disabledDomains'] || [];
});

function addDisabledDomain(d) {
	disabledDomains.push(d);
	console.log(disabledDomains);
}

function setDisabledDomains(r) {
	disabledDomains = r;
}

var _f = function(first) {
	console.log("_f called");
	chrome.tabs.query({pinned:true}, function (tabs) {
		for(var i = 0; i<tabs.length; i++) {
			for(var j = 0; j<disabledDomains.length; j++) {
				if(tabs[i].url.indexOf(disabledDomains[j])>=0) {
					return ;
				} 
			}
			// first time to see this tab. Get the favicon and store it
			if(typeof ids[tabs[i].id] == "undefined") {
				// Don't take my icon if the extension is reloaded
				if(!tabs[i].favIconUrl)
					continue;
				if(tabs[i].favIconUrl.split("data:image/png").length>1) {
					// if never reloaded
					if(typeof alreadyReloaded[tabs[i].id] == "undefined") {
						chrome.tabs.reload(tabs[i].id);
						alreadyReloaded[tabs[i].id] = true;
						continue;
					}
				}
				ids[tabs[i].id] = {};
				ids[tabs[i].id].tab = tabs[i];
				ids[tabs[i].id].originalIcon = tabs[i].favIconUrl;
				ids[tabs[i].id].oldN = getNumberFromTitle(tabs[i].title);

				var img = new Image();
				img.onload = (function(uid,img) {
					var cImg = img;
					ids[uid].dataIcon = cImg; 
					return function() {
						ids[uid].dataIcon = cImg; 
						if(ids[uid].oldN != 0) {
							var base64 = createIcon(cImg,ids[uid].oldN);
							injectFavicon(uid,base64);
						}
					}
				})(tabs[i].id,img);
				img.src = tabs[i].favIconUrl;
			}else {
				var newNumber = getNumberFromTitle(tabs[i].title);
				if(newNumber != ids[tabs[i].id].oldN) {
					var base64 = createIcon(ids[tabs[i].id].dataIcon,newNumber);
					ids[tabs[i].id].oldN = newNumber;
					injectFavicon(tabs[i].id,base64);
				}
			}
			


			
		}
		setTimeout(_f,2000);
	});
};

function injectFavicon(tabId,base64) {
	
	var code = '(function() {'+
	'var notLink = document.querySelector("#notifycon"); '+
	'if(!notLink) {'+
	'var link, oldLink, '+
	'links = document.querySelectorAll("link[rel=\'icon\'],link[rel=\'shortcut icon\']");'+"\n"+
	'for(var i =0; i<links.length; i++) {'+"\n"+
	'   links[i].parentNode.removeChild(links[i])'+
	'}'+"\n"+
	'var link = document.createElement("LINK");'+"\n"+
	'link.rel = "icon";'+"\n"+
	'link.type="image/x-icon";'+"\n"+					
	'link.href = "'+base64+'";'+"\n"+
	'link.id = "notifycon";'+"\n"+
	'link.dataset.originalIcon = "";'+"\n"+	
	
	'document.head.appendChild(link);'+"\n"+
	'}'+
	'else {'+
	'notLink.href = "'+base64+'";'+"\n"+
	'}'+
	'})()';
	console.log("Icon of " + ids[tabId].tab.url+ " changed to " + ids[tabId].oldN);
	console.log(ids[tabId].tab);
	console.log(ids[tabId].tab.InjectDetails);

	
	chrome.tabs.executeScript(tabId, {code:code}, function() {
		console.log("icona cambiata");
	})
	
}
/**
 * public
 */
function createIcon(imgIco,nText) {
	var canvas = document.createElement('canvas');
	canvas.height = canvas.width = 16; // set the size
	
	var ctx = canvas.getContext('2d');

	if(nText != 0 && nText != "") {
		var len = Math.min(3,nText.toString().length);
		var startX = 10-(len-1)*5;
		ctx.drawImage(imgIco, 0, -2, 16,16);
		
		ctx.rect(startX-2, 8, 30, 14);
		ctx.lineWidth = 1;
		
		ctx.fillStyle = 'red';
		ctx.strokeStyle = 'black'
		ctx.shadowColor = '#000';
	    ctx.fill();
		
		ctx.font = 'bold 9px sans-serif';
		ctx.fillStyle = '#fff';
		/*
		ctx.shadowColor = "#000";
	    ctx.shadowOffsetX = 0;
	    ctx.shadowOffsetY = 0;
	    ctx.shadowBlur = 1;
	    */
	    ctx.fillText(nText, startX, 15);

	}else {
		return imgIco.src;
	}
	return canvas.toDataURL('image/png');

}

function getNumberFromTitle(title) {
	var mtch = title.match(/\(([0-9]+)[^0-9]*?\)/) || [];
	if(mtch.length>1) {
		return  mtch[1];
	}
	return 0;
}

_f();
chrome.tabs.onHighlighted.addListener(function(highlightInfo) {
	//console.log(highlightInfo.tabIds);
	//_f();
});
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//	if(changeInfo.status=="complete" && ids[tabId])
//		ids[tabId].oldN = 0;
});

