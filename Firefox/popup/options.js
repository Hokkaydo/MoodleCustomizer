const icons = {
    on: "icons/on.png",
    off: "icons/off.png"
};

const toggleKeepAlive = document.createElement("p");
const keepAliveOnOff = document.createElement("img");
keepAliveOnOff.src = browser.runtime.getURL("icons/on.png");
toggleKeepAlive.textContent = "KeepAlive : "
var keepAlive = true;
toggleKeepAlive.addEventListener("click", (event) => {
    keepAlive = !keepAlive;
    toggleKeepAlive.textContent = "KeepAlive : ";
    keepAliveOnOff.src = browser.runtime.getURL("icons/" + (keepAlive ? "on.png" : "off.png"));
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {command: "toggle", feature: "keepAlive"});
    });
});
const list = document.getElementsByClassName("list")[0]
const onoff = document.createElement("div");
onoff.classList.add("onoff");
onoff.appendChild(keepAliveOnOff);
list.appendChild(toggleKeepAlive);
list.appendChild(onoff);