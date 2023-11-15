browser.webRequest.onBeforeRequest.addListener(
    function (details) {
        if (!details.url.includes("moodle") || !details.url.includes("forcedownload=1")) {
          return;
        }
        let new_url = details.url.replace("forcedownload=1","forcedownload=0");
        return {
            redirectUrl: new_url
        }
    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking"]
)
