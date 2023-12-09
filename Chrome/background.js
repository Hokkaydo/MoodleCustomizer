chrome.runtime.onInstalled.addListener(async () => {

    for (const cs of chrome.runtime.getManifest().content_scripts) {
		for (const tab of await chrome.tabs.query({ url: cs.matches })) {
			chrome.scripting.executeScript({
				target: { tabId: tab.id },
				files: cs.js,
			});
		}
	}
});

chrome.storage.local.onChanged.addListener(async (chan) => {
	if (chan.avoidPdfDownload) {
		let enabled = chan.avoidPdfDownload.newValue;
		await chrome.declarativeNetRequest.updateStaticRules({
				disableRuleIds: enabled ? [] : [1],
				enableRuleIds: enabled ? [1] : [],
				rulesetId: "ruleset_1"
		})
		console.log("updated")
	}
})

async function pdfSetup() {
	let storage = await chrome.storage.local.get('avoidPdfDownload');
	if (Object.keys(storage).includes("avoidPdfDownload") && !storage.avoidPdfDownload) { //If avoidPdfDownload is not in keys -> default setting -> should not disable.
		console.log("Disabling pdfDownload because of settings.")
		await chrome.declarativeNetRequest.updateStaticRules({
				disableRuleIds: [1],
				enableRuleIds: [],
				rulesetId: "ruleset_1"
		})
	}
}

pdfSetup();
