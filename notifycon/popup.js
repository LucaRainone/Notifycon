
var o = new Rain1Overlay("popup"),
    DEBUG = true,
	currentImageData,
	d = document,
	R1 = function(selector) {
		return d.querySelectorAll(selector);
	},
	isFirstTime = true,
	oStorage = o.getStorageOverlay(),
	regExpDomain = /^http[s]?:\/\/(.*?)\//;
	
o.debug = true;
document.addEventListener("DOMContentLoaded",_ready);


oStorage.get('seenInstruction',function(result) {
	rlog(result);
	isFirstTime = (result['seenInstruction'] != "1");
	rlog("is first time: " + isFirstTime);
});

function hideAllPages() {
	var els = R1('.page');
	for(var i = 0; i<els.length ; i++) {
		els[i].style.display = 'none';
	}
}

function rlog(a,b) {
    if(DEBUG) {
        console.log(a, b);
    }
}

oStorage.get('disabledDomains', function(obj) {

	if(!obj['disabledDomains'])
		obj['disabledDomains'] = [];
	o.getCurrentTab(function(oTab) {
		if(oTab) {
			if(!oTab.hasChromeProtocol()) {
				if(!oTab.tab.pinned) {
					R1('#notifycon_page_unpinnedtab')[0].style.display = 'block';
				}else {
					var domainName =  oTab.tab.url.match(regExpDomain)[1];
					var fullPath   =  oTab.tab.url.match(/^http[s]?:\/\/([^\#\?]*)/)[1];
					
					var isDisabled = false;
					for(var i = 0; i<obj['disabledDomains'].length; i++) {
						if(domainName == obj['disabledDomains'][i]) {
							isDisabled = true;
							break;
						}
					}
					
					var els = R1('.domainName');
					for(var i = 0; i < els.length; i++) {
						els[i].innerHTML = domainName;
					}
					els = R1('.fullPath');
					for(i = 0; i < els.length; i++) {
						els[i].innerHTML = fullPath;
					}
					
					if(isDisabled) {
						R1('#notifycon_page_disabled')[0].style.display = 'block';
						var el = R1('#title_page_disabled')[0];
						el.innerHTML = el.innerHTML.split("%domainName").join(domainName);
					}else {
						R1('#notifycon_page_options')[0].style.display = 'block';
						var el = R1('#disable_domain')[0];
						el.innerHTML = el.innerHTML.split("%domainName").join(domainName);
					}
				}
				
				currentImageData= new Image();
				currentImageData.src = oTab.tab.favIconUrl;
				
			}else {
				R1('#notifycon_page_warning')[0].style.display = 'block';
			}
		}
	});

});

function _ready() {
	// translate data-text
	o.translate();
	
	R1('#action_pin_tab_not_pinned')[0].addEventListener('mouseover',function() {
		R1('.example_tab')[0].className += " pinned";
	});
	R1('#action_pin_tab_not_pinned')[0].addEventListener('mouseout',function() {
		var el = R1('.example_tab')[0];
		el.className = el.className.split(" pinned").join("");
	});
	o.getCurrentTab(function(oTab) {
		var els = R1('.current_favicon');
		for(var i = 0; i<els.length; i++) {
			els[i].innerHTML = '<img src="'+oTab.tab.favIconUrl+'" />';
		}
	});
	
	
	
	/*** CLICKS EVENT ***/
	document.addEventListener('click',function(e) {
		rlog(e);
		rlog(e.target);
		rlog(e.target.parentNode);
		if(e.target.className.split('action_unpin_tab').length>1) {
			o.getCurrentTab(function(oTab) {
				oTab.update({pinned:false});
				if(e.target.dataset.action == "just-try") {
					window.close();
				}else {
					hideAllPages();
					R1('#notifycon_page_unpinnedtab')[0].style.display = "block";
					
				}
			});
		}else if(e.target.className.split('action_pin_tab').length>1) {
			o.getCurrentTab(function(oTab) {
				oTab.update({pinned:true});
				var domainName =  oTab.tab.url.match(regExpDomain)[1];
				if(isFirstTime) {
					hideAllPages() 
					R1('#notifycon_page_justpinned')[0].style.display = "block";
					
					R1('.current_favicon.example_favicon.demo img')[0].src = chrome.extension.getBackgroundPage().createIcon(currentImageData,3);
					oStorage.set({'seenInstruction':'1'});
					isFirstTime = false;
				}else {
					hideAllPages() 
					R1('#notifycon_page_options')[0].style.display = "block";
					var el = R1('#disable_domain')[0];
					el.innerHTML = el.innerHTML.split("%domainName").join(domainName);
				}
			});
		}else if(e.target.className.split('action_disable_domain').length>1 || e.target.parentNode.className.split('action_disable_domain').length>1) {
			
			o.getCurrentTab(function(oTab) {
				oStorage.get('disabledDomains', function(result) {
					rlog(result);
					var domainName =  oTab.tab.url.match(regExpDomain)[1];
					if(!result['disabledDomains']) {
						result['disabledDomains'] = [];
					}
					result['disabledDomains'].push(domainName);
					chrome.extension.getBackgroundPage().addDisabledDomain(domainName);
					
					
					oStorage.set(result,function() {
						var el = R1('#title_page_disabled')[0];
						el.innerHTML = el.innerHTML.split("%domainName").join(domainName);
						
						hideAllPages() 
						R1('#notifycon_page_disabled')[0].style.display = "block";
					});
				});
				
			});
		}else if(e.target.className.split('action_enable_domain').length>1 || e.target.parentNode.className.split('action_enable_domain').length>1) {
			o.getCurrentTab(function(oTab) {
				oStorage.get('disabledDomains', function(result) {
					rlog(result);
					var domainName =  oTab.tab.url.match(regExpDomain)[1];
					for(var i = 0; i<result['disabledDomains'].length; i++) {
						if(result['disabledDomains'][i] == domainName) {
							rlog("delete " + result['disabledDomains'][i])
							delete result['disabledDomains'][i];
							i--;
						}
					}
					
					chrome.extension.getBackgroundPage().setDisabledDomains(result['disabledDomains']);
					oStorage.set(result,function() {
						var el = R1('#title_page_disabled')[0];
						el.innerHTML = el.innerHTML.split("%domainName").join(domainName);
						
						hideAllPages() 
						window.close();
					});
				});
				
			});
		}else if(e.target.className.split('action_close').length>1) {
			window.close();
		}else if(e.target.className.split('hide_ancor').length>1 || e.target.parentNode.className.split('hide_anchor').length>1) {
			o.openUrl(e.target.href || e.target.parentNode.href);
		}else if(e.target.className.split('reset_tutorial').length > 1) {
            e.preventDefault();
            e.stopPropagation();
            isFirstTime = true;
            oStorage.set({'seenInstruction':null});
        }
	});

	/*
	var i18nEls = R1('.i18n');
	var translate = {};
	for(var  i = 0 ; i<i18nEls.length; i++) {
		var attr = i18nEls[i].dataset.text;
		rlog(attr)
		var key = i18nEls[i].dataset.key;
		if(!key) 
			console.error(attr +" without data-key");
		translate[key] = {message:attr};
	}
	rlog(JSON.stringify(translate));
	*/
}

