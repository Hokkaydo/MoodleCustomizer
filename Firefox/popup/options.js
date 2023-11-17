let settings = {};

for (input of document.getElementsByTagName("input")) {
    if (!input.type == "checkbox") {
        console.log(input);
        continue;
    }
    let item = input.dataset.item;
    input.checked = localStorage.getItem(item) !== 'false';
    settings[item] = input.checked;
    input.addEventListener("click", (e) => {
        settings[item] = e.target.checked;
        browser.storage.local.set(settings);
        localStorage.setItem(item, e.target.checked);
    })
}


