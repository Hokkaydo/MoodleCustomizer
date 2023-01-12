const toggleKeepAlive = document.createElement("p");
const keepAliveOnOff = document.createElement("img");
var keepAlive = localStorage.getItem("keepAlive") === 'true';
keepAliveOnOff.src = browser.runtime.getURL("icons/" + (keepAlive ? "on.png" : "off.png"));
toggleKeepAlive.textContent = "KeepAlive : ";

toggleKeepAlive.addEventListener("click", (_event) => {
    const keepAlive = localStorage.getItem("keepAlive") === 'true';
    localStorage.setItem("keepAlive", !keepAlive);
    toggleKeepAlive.textContent = "KeepAlive : ";
    keepAliveOnOff.src = browser.runtime.getURL("icons/" + (!keepAlive ? 'on.png': 'off.png'));
    browser.storage.local.set({keepAlive: !keepAlive})
});

const list = document.getElementsByClassName("list")[0]
const onoff = document.createElement("div");
onoff.classList.add("onoff");
onoff.appendChild(keepAliveOnOff);
list.appendChild(toggleKeepAlive);
list.appendChild(onoff);