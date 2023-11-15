var keepAliveIntervalId;
var keepAliveEnabled = localStorage.getItem("keepAlive") === 'true';
var moodleURLBase = ''

browser.storage.local.onChanged.addListener(changes => {
    if (changes.keepAlive) {
        keepAliveEnabled = changes.keepAlive.newValue;
        if (keepAliveEnabled) {
            runKeepAlive();
        } else {
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
