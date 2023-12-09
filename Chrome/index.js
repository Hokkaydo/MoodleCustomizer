var keepAliveIntervalId;
var keepAliveEnabled = localStorage.getItem("keepAlive") !== 'false';
var sesskey = '';
var moodleURLBase = ''

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.keepAlive) {
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
    if (sesskey === '') {
        setupSesskey(() => {
            if (keepAliveEnabled) {
                runKeepAlive();
            }
        })
    } else {
        if (keepAliveEnabled) {
            runKeepAlive();
        }
    }

}

function setupSesskey(callback) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL("retrieveVariables.js");
    script.onload = function () {
        script.remove();
    }
    document.addEventListener("RetrieveVariable", e => {
        const detail = e.detail;
        if (detail.split("=")[0] === 'sesskey' && sesskey === '') {
            sesskey = detail.split("=")[1];
            callback();
        }
    })
    document.documentElement.appendChild(script);

}

function runKeepAlive() {
    console.log("ran")
    if(moodleURLBase === '') {
        return;
    }
    if (sesskey === '') {
        setupSesskey(() => runKeepAlive());
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
        fetch(moodleURLBase + "/lib/ajax/service.php?sesskey=" + sesskey, fetchOptions)
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
