var cm = require("sdk/context-menu");

var frame = require("sdk/ui/frame");

var {Cc, Ci} = require("chrome");
var cp = Cc["@mozilla.org/cookie/permission;1"].getService(Ci.nsICookiePermission);

var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

var TLDSvc = Cc["@mozilla.org/network/effective-tld-service;1"].getService(Ci.nsIEffectiveTLDService);

var cookieManager = Cc["@mozilla.org/cookiemanager;1"].getService(Ci.nsICookieManager);

function makeURI(aURL, aBaseURI) {
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    return ioService.newURI(aURL, null, aBaseURI);
}

function getHostName(url) {
    try {
	var baseStr = TLDSvc.getBaseDomain(url, null);
	return baseStr;
    } catch (e) {
	return "";
    }

}
function getHost(url){
    return makeURI('http://' +getHostName(url), null);
}


function getCurrentBaseDomain(){
    var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();
    return getHost(browser.currentURI);
}

function deleteCookies(url) {
    var hn = getHostName(url);
    var it = cookieManager.enumerator;

    while (it.hasMoreElements())
    {
    	var cookie = it.getNext().QueryInterface(Ci.nsICookie2);
    	if (cookie.rawHost.contains(hn)) {
    	    cookieManager.remove(cookie.host, cookie.name, cookie.path, true);
    	}
    }
}

function changeCurrentPageAccess(access) {
    var url = getCurrentBaseDomain();
    cp.setAccess(url, access);
}

function access_to_string(access) {
    switch(access){
    case cp.ACCESS_DEFAULT:
	return "Default cookie policy";
    case cp.ACCESS_ALLOW:
	return "Always allows cookies";
    case cp.ACCESS_DENY:
	return "Never allows cookies";
    default:
	return "Unknown cookie policy";
    }
}

var status = cm.Item({
    label: "Cookie status",
    context: cm.PageContext(),
});

var allow = cm.Item({
    label: "Always allow cookies",
    context: cm.PageContext(),
    contentScript: 'self.on("click", self.postMessage);',
    onMessage: function (_p) {
	changeCurrentPageAccess(cp.ACCESS_ALLOW);
    }
});

var def = cm.Item({
    label: "Set default policy",
    context: cm.PageContext(),
    contentScript: 'self.on("click", self.postMessage);',
    onMessage: function (_p) {
	changeCurrentPageAccess(cp.ACCESS_DEFAULT);
    }
});

var block = cm.Item({
    label: "Never allow cookies",
    context: cm.PageContext(),
    contentScript: 'self.on("click", self.postMessage);',
    onMessage: function (_p) {
	changeCurrentPageAccess(cp.ACCESS_DENY);
	deleteCookies(getCurrentBaseDomain());
    }
});

function setStatusLabel(_p)
{
    var url = getCurrentBaseDomain();
    var a = cp.canAccess(url, null, null);
    status.label = 'Current policy: ' + access_to_string(a);
    return true;
}

cm.Menu({
    label: "Cookie Locker",
    contentScript: 'self.on("click", self.postMessage);',
    context: cm.PredicateContext(setStatusLabel),
    items: [status, allow, def, block]
})
