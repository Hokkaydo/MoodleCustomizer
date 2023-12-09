browser.webRequest.onBeforeRequest.addListener(
    async function (details) {
        let settings = await browser.storage.local.get("avoidPdfDownload");
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
