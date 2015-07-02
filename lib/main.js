var cm = require("sdk/context-menu");

var frame = require("sdk/ui/frame");

var {Cc, Ci} = require("chrome");
var cp = Cc["@mozilla.org/cookie/permission;1"].getService(Ci.nsICookiePermission);

var wm = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);

function getCurrentURL(){
    var browser = wm.getMostRecentWindow("navigator:browser").getBrowser();
    return browser.currentURI;
}

function makeURI(aURL, aBaseURI) {
    var ioService = Cc["@mozilla.org/network/io-service;1"]
        .getService(Ci.nsIIOService);
    return ioService.newURI(aURL, null, aBaseURI);
}

function changeCurrentPageAccess(access) {
    	var url = getCurrentURL();
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
    // contentScript: 'self.on("click", self.postMessage);',
    // onMessage: function(_p) {
    // 	var url = getCurrentURL();
    // 	var access = cp.canAccess(url, null, null);
    // 	this.label = access_to_string(access);
    // 	console.log('access:' + access_to_string(access));
    // }
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
    }
});

function setStatusLabel(_p)
{
    status.label = 'Current policy: ' +
	access_to_string(cp.canAccess(getCurrentURL(), null, null));
    return true;
}

cm.Menu({
    label: "Cookie Locker",
    contentScript: 'self.on("click", self.postMessage);',
    context: cm.PredicateContext(setStatusLabel),
    items: [status, allow, def, block]
})