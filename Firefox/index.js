var keepAliveIntervalId;
var keepAliveEnabled = localStorage.getItem("keepAlive") !== 'false'; // not === true to avoid disabled by default.
var moodleURLBase = ''

browser.storage.local.onChanged.addListener(changes => {
    if (changes.keepAlive) {
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
    if (keepAliveEnabled) {
        runKeepAlive();
    }
}




function runKeepAlive() {
    wrappedJSObject.console.log("ran")
    if(moodleURLBase === '') {
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
        fetch(moodleURLBase + "/lib/ajax/service.php?sesskey=" + wrappedJSObject.M.cfg.sesskey, fetchOptions)
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

function download(dataurl, filename) {
  var a = document.createElement("a");
  a.href = dataurl;
  a.setAttribute("download", filename);
  a.click();
  return false;
}

function bulkDownload() {
    const links = Array.from(document.getElementsByTagName("a"))
        //moodle adds by its own an hidden "Fichier" text inside <a> linking a file. it's convenient.
        .filter(x => x.innerText.includes("Fichier") && x.className.includes("aalink"))
        //adding download state
        .map(x => [x, false]);

    let allOfThem = confirm("Do you want to download all of them ? ");
    
    //if we download of all of them, skip download popup
    let currentItem = allOfThem ? links.length : 0;

    //Utils functions
    const stripName = (name) => name.replace("\nFichier","");
    const getString = () => {
        return "Download list: \n" + links.filter(x => x[1]).map(x => "    - " +stripName(x[0].innerText)).join("\n") + "\n"
            +`Do you want to add ${stripName(links[currentItem][0].innerText)} to download list: `;
    }
    
    //very basic popup to ask user which file to download. can be improved but it doesnt have to.
    while (currentItem < links.length) {
        if (confirm(getString())) {
            links[currentItem][1] = true;
        };
        currentItem += 1;
    }

    for (let link of links) {
        if (allOfThem || link[1]) {
            fetch(link[0].href).then(async res => {
                let afterRedirectsUrl = res.url.split("/");
                let filename = afterRedirectsUrl[afterRedirectsUrl.length-1].split("?")[0];
                return {filename, blob: await res.blob()};
            }).then(({filename, blob}) => {
                console.log(filename, blob);
                var file = window.URL.createObjectURL(blob);
                download(file, filename)
            });
        }
    }

    

    
}
function addBulk() {
    if (!document.location.href.includes("course")) {
        return;
    }
    const container = document.getElementById("page-header").children[0].children[1];
    //avoid adding multiple bulk buttons with web-ext hot reload.
    if (container.children.length > 2) {
        container.removeChild(container.lastChild)
    }
    const button = document.createElement("button");
    button.innerText = "Bulk Download"
    button.className = "btn  btn-primary"
    button.onclick = bulkDownload
    container.appendChild(button)
}
addBulk();
 
