browser.webRequest.onBeforeRequest.addListener(
    async function (details) {
        let settings = await browser.storage.local.get("avoidPdfDownload");
        if (!details.url.includes("moodle")) {
            return;
        }

        if (details.url.endsWith("/my/recap.php")) {
            //hook response.
            let filter = browser.webRequest.filterResponseData(details.requestId);
            filter.ondata = (e) => hook_recap(filter, details.url, e);
            return;
        }

        //pdf redirection
        if (details.url.includes("forcedownload=1") && settings.avoidPdfDownload === true) {
            let new_url = details.url.replace("forcedownload=1","forcedownload=0");
            return {
                redirectUrl: new_url
            }
        }

    },
    {
        urls: ["<all_urls>"]
    },
    ["blocking"]
)

async function hook_recap(filter, url, event) {
    let baseMoodle = url.replace("recap.php","");
    let response = await fetch(baseMoodle);
    filter.write(new TextEncoder().encode(await response.text()));
    filter.disconnect();
}
