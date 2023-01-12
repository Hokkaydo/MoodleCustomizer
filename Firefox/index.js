if (document.URL.includes("moodle") && location.hostname !== 'moodle') {
    var keepAliveIntervalId = runKeepAlive();
    browser.runtime.onMessage.addListener(message => {
        if(message.command === "toggle") {
            if(message.feature === "keepAlive") {
                if(keepAliveIntervalId !== -1) {
                    clearInterval(keepAliveIntervalId);
                    keepAliveIntervalId = -1;
                }else {
                    keepAliveIntervalId = runKeepAlive();
                }
            }
        }
    });
}

function runKeepAlive() {
    return setInterval(() => {
        const fetchOptions =
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: '[{"index":0,"methodname":"core_session_touch","args":{}}]'
        }
        fetch("https://moodle.uclouvain.be/lib/ajax/service.php?sesskey=" + wrappedJSObject.M.cfg.sesskey, fetchOptions)
            .then(body => body.json())
            .then(body => {
                body = body[0];
                if (body.error) {
                    const err = body.exception;
                    console.error("An error occured while trying to keep Moodle session alive : " + err.message + "\n Error code : " + err.errorcode);
                } 
            });
    }, 1*60*60*1000);
}