browser.webRequest.onBeforeRequest.addListener(
    async function (details) {
        let settings = await browser.storage.local.get("avoidPdfDownload");
        //in this case we have to force download because it's what the user wants.
        if (details.url.includes("#BULK")) {
            console.log("bulk ", details.url)
            if (details.url.includes("forcedownload=1")) {
                return;
            }
            if (details.url.includes("forcedownload=0")) {
                let new_url = details.url.replace("forcedownload=0", "forcedownload=1");
                return {redirectUrl: new_url}
            }
            else {
                let new_url = details.url + (details.url.includes("?") ? "&" : "?") + "forcedownload=1"
                return {redirectUrl: new_url}
            }
        }
        console.log(settings)
        if (!details.url.includes("moodle") || !details.url.includes("forcedownload=1") || settings.avoidPdfDownload === false) {
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
