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

async function bulkDownload() {
    await injectZIPJs()
    console.log("injected")
    let links = Array.from(document.getElementsByTagName("a"))
        //moodle adds by its own an hidden "Fichier" text inside <a> linking a file. it's convenient.
        .filter(x => x.innerText.includes("Fi") && x.className.includes("aalink"))
   
    let folders = Array.from(document.getElementsByTagName("a"))
        //moodle adds by its own an hidden "Dossier" text inside <a> linking a folder. it's convenient.
        .filter(x => (x.innerText.includes("Dossier") || x.innerText.includes("Folder")) && x.className.includes("aalink"))
   
     for (let folder of folders) {
        console.log("fetching ", folder.innerText, folder.href)
        let req = await fetch(folder.href);
        let content = await req.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(content, 'text/html');
        const folderLinks = Array.from(htmlDoc.getElementsByTagName("a"))
            .filter(x => x.parentNode.className.includes("fp-filename-icon"))
        for (let link of folderLinks) {
            links.push(link)
        }
    }
    //adding download state
    links = links.map(x => [x, false]);
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
    const zip = window.wrappedJSObject.zip;
    const zipFileWriter = new zip.BlobWriter();
    const zipWriter = new zip.ZipWriter(zipFileWriter);

    for (let link of links) {
        if (allOfThem || link[1]) {
            const res = await fetch(link[0].href);
            let afterRedirectsUrl = res.url.split("/");
            let filename = afterRedirectsUrl[afterRedirectsUrl.length-1].split("?")[0];
            //yes, this code will re-do a fetch. i tried to use BobReader to avoid that, but i couldn't manage to make it work.
            //i guess it's still some firefox issues. 
            //but fetch will cache the result, so it's not necessary that bad.
            await zipWriter.add(filename, new zip.HttpReader(link[0].href));
        }
    }
    const blob = await zipWriter.close();
    let url = URL.createObjectURL(blob);
    const courseName = document.getElementsByClassName("page-header-headings")[0].innerText;
    download(url, courseName+"-bulk.zip")


    

    
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

//injecting using esm modules. Tried some other ways but it was the only working way..
async function injectZIPJs() {
    const script = document.createElement("script")
    script.type = "module"
    script.innerText = `
        import {BlobWriter, TextWriter, ZipWriter, BlobReader, HttpReader} from "https://deno.land/x/zipjs/index.js"; window.zip = {HttpReader,BlobWriter, TextWriter, ZipWriter, BlobReader}`
    document.head.appendChild(script)
}

addBulk();
 
