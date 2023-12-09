var keepAliveIntervalId;
var keepAliveEnabled = localStorage.getItem("keepAlive") !== 'false'; // not === true to avoid disabled by default.
var moodleURLBase = ''

browser.storage.local.onChanged.addListener(changes => {
    if (changes.keepAlive) {
        keepAliveEnabled = changes.keepAlive.newValue;
        if (keepAliveEnabled) {
            runKeepAlive();
        } else {
            console.log("clear")
            clearInterval(keepAliveIntervalId);
        }
        localStorage.setItem("keepAlive", keepAliveEnabled);
    }
});

if (document.URL.includes("moodle") && location.hostname !== 'moodle') {
    moodleURLBase = location.origin;
    if (keepAliveEnabled) {
        runKeepAlive();
    }
}




function runKeepAlive() {
    wrappedJSObject.console.log("ran")
    if(moodleURLBase === '') {
        return;
    }
    clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = setInterval(() => {
        const fetchOptions =
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '[{"index":0,"methodname":"core_session_touch","args":{}}]'
        }
        fetch(moodleURLBase + "/lib/ajax/service.php?sesskey=" + wrappedJSObject.M.cfg.sesskey, fetchOptions)
            .then(body => body.json())
            .then(body => {
                body = body[0];
                if (body.error) {
                    const err = body.exception;
                    console.error("An error occured while trying to keep Moodle session alive : " + err.message + "\n Error code : " + err.errorcode);
                }
            });
    }, 1 * 60 * 60 * 1000);
}


function addRecapToNavbar() {
    let menu = document.querySelectorAll('[role="menubar"]')[0];
    let home = menu.children[0];
    menu.removeChild(home);
    let item = menu.children[0].cloneNode(true);
    item.children[0].innerText = "Recap"
    item.children[0].href = "/my/recap.php"
    item.children[0].className = item.children[0].className.replace("active","")
    if (document.location.href.includes("recap.php")) {
        item.children[0].className += " active"
        for (let it of menu.children) {

            it.children[0].className = it.children[0].className.replace("active","")
        }
    }
    menu.prepend(item);
    menu.prepend(home);
}

addRecapToNavbar();