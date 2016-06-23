"use strict";

var o = new Rain1Overlay("background");
var icons = {};
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

function injectFavicon(tab,base64) {
	
	let code = '(function() {'+
	'var notLink = document.querySelector("#notifycon"); '+
	'if(!notLink) {'+
	'var link, oldLink, '+
	'links = document.querySelectorAll("link[rel=\'icon\'],link[rel=\'shortcut icon\']");'+"\n"+
	'for(let link of links) {'+"\n"+
	'   link.setAttribute(\'rel\', \'icon_old\');'+
	'}'+"\n"+
	'var link = document.createElement("LINK");'+"\n"+
	'link.rel = "icon";'+"\n"+
	'link.type="image/x-icon";'+"\n"+					
	'link.href = "'+base64+'";'+"\n"+
	'link.id = "notifycon";'+"\n"+
	
	'document.head.appendChild(link);'+"\n"+
	'}'+
	'else {'+
	'notLink.href = "'+base64+'";'+"\n"+
	'}'+
	'})()';
	console.log("Icon of " + tab.url+ " changed to " + icons[tab.id].oldN);
	console.log(tab);
	console.log(tab.InjectDetails);

	
	chrome.tabs.executeScript(tab.id, {code:code}, function() {
		console.log("icona cambiata");
	})
	
}
/**
 * public
 */
function createIcon(imgIco,nText) {
	let canvas = document.createElement('canvas');
	canvas.height = canvas.width = 16; // set the size
	
	let ctx = canvas.getContext('2d');

	if(nText != 0 && nText != "") {
		let len = Math.min(3,nText.toString().length);
		let startX = 10-(len-1)*5;
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
	let mtch = title.match(/\(([0-9]+)[^0-9]*?\)/) || [];
	if(mtch.length>1) {
		return  mtch[1];
	}
	return 0;
}

// return domain name - jpaglier
function get_domain_from_url(url) {
	let a = document.createElement('a');
	a.setAttribute('href', url);
	return a.hostname;
}

function processTab(tab) {
	// simplify the disabledDomains search
	let domain = get_domain_from_url(tab.url);
	if(disabledDomains.indexOf(domain) >= 0) return;

	// first time to see this tab. Get the favicon and store it
	if(icons[tab.id] === undefined) {
		// Don't take my icon if the extension is reloaded
		if(!tab.favIconUrl) return;
		// prevent using a notifycon as base - fix stuck notification bug jpaglier
		if(tab.favIconUrl.indexOf('http') < 0)  return;

		icons[tab.id] = {};
		icons[tab.id].oldN = getNumberFromTitle(tab.title);
		icons[tab.id].dataIcon = getImgData(tab.favIconUrl);
	}

	// remove some code duplication - simplify codepath - jpaglier
	let newNumber = getNumberFromTitle(tab.title);
	if(newNumber != icons[tab.id].oldN) {
		let base64 = createIcon(icons[tab.id].dataIcon,newNumber);
		icons[tab.id].oldN = newNumber;
		injectFavicon(tab,base64);
	}
}

// get image data - abstracted by jpaglier
function getImgData(url) {
	let img = new Image();
	img.src = url;
	return img.onload = (function(img) {
		return img;
	})(img);

}

// listeners are better - jpaglier
function createdListener(tab) {
	if(tab.pinned) processTab(tab);
}

function updatedListener(tabId, changeInfo, tab) {
	if(changeInfo['title'] && tab.pinned) processTab(tab); 
}

// much simple main() - jpaglier
var _f = function(first) {
	chrome.tabs.onCreated.addListener(createdListener);
	chrome.tabs.onUpdated.addListener(updatedListener);
	// do best to remove old notifycon favicons
	chrome.tabs.query({'pinned':true}, function (tabs) {
			for(let tab of tabs) {
//                                removeFavicons(tab);
                                chrome.tabs.reload(tab.id);
			}
		}
	);

};

_f();
