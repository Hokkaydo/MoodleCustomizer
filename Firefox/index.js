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
  if (moodleURLBase === '') {
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


//this function return an element shown as a popup.
function getPopup() {
  let backdrop = document.createElement("div")
  backdrop.style = `
    position: absolute;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1031; /*moodle navbar is z-index 1030. idk why*/
    `;
  let div = document.createElement("div")
  div.style = `
    background-color: white;
    border-radius: 5px;
    width: 50vw;
    height: 65vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    overflow-y: scroll;
    `;
  backdrop.appendChild(div)
  document.body.appendChild(backdrop)
  return div;
}

function hidePopup(popup) {
  document.body.removeChild(popup.parentNode)
}

async function bulkDownload() {
  await injectZIPJs()
  let popup = getPopup();
  popup.innerHTML = "<h2 style='text-align: center'>Fetching infos about documents...</h2>"

  let links = Array.from(document.getElementsByTagName("a"))
    //moodle adds by its own an hidden "Fichier" text inside <a> linking a file. it's convenient.
    .filter(x => x.innerText.includes("Fi") && x.className.includes("aalink"))

  let folders = Array.from(document.getElementsByTagName("a"))
    //moodle adds by its own an hidden "Dossier" text inside <a> linking a folder. it's convenient.
    .filter(x => (x.innerText.includes("Dossier") || x.innerText.includes("Folder")) && x.className.includes("aalink"))

  popup.innerHTML = "<h2 style='text-align: center'>Fetching folders content...</h2>"
  for (let folder of folders) {
    console.log("fetching folder", folder.innerText, folder.href)
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
  popup.innerHTML = `<div style='width: 100%; height: 100%'>
        <h2>Files to download</h2>
        <div>
        </div>
    </div>`
  links = links.map(x => [x, true]);
  for (let link of links) {
    let check = document.createElement("input")
    check.type = "checkbox"
    popup.firstChild.appendChild(check)
    popup.firstChild.innerHTML += " " + link[0].innerText + "</br>"
  }
  let button = document.createElement("button");
  button.className = "btn btn-primary"
  button.innerHTML = "Download"
  popup.firstChild.appendChild(button);

  Array.from(popup.getElementsByTagName("input")).forEach((e, i) => {
    e.click();
    e.addEventListener('click', (ev) => {
      links[i][1] = ev.target.checked;
      console.log(links[i])
    });
  })
  popup.getElementsByTagName("button")[0].onclick = async () => {

    const zip = window.wrappedJSObject.zip;
    const zipFileWriter = new zip.BlobWriter();
    const zipWriter = new zip.ZipWriter(zipFileWriter);
    let count = links.filter(x => x[1]).length;
    let current_count = 0;
    for (let link of links) {
      if (link[1]) {
        current_count += 1;
        popup.innerHTML = `<h4>Downloading: ${current_count}/${count}</h4>`;
        const res = await fetch(link[0].href);
        let afterRedirectsUrl = res.url.split("/");
        let filename = afterRedirectsUrl[afterRedirectsUrl.length - 1].split("?")[0];

        //yes, this code will re-do a fetch. i tried to use BobReader to avoid that, but i couldn't manage to make it work.
        //i guess it's still some firefox issues. 
        //but fetch will cache the result, so it's not necessary that bad.
        await zipWriter.add(filename, new zip.HttpReader(link[0].href));
      }
    }
    const blob = await zipWriter.close();
    let url = URL.createObjectURL(blob);
    const courseName = document.getElementsByClassName("page-header-headings")[0].innerText;
    download(url, courseName + "-bulk.zip")
    hidePopup(popup)
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

//injecting using esm modules. Tried some other ways but it was the only working way..
async function injectZIPJs() {
  const script = document.createElement("script")
  script.type = "module"
  script.innerText = `
        import {BlobWriter, TextWriter, ZipWriter, BlobReader, HttpReader} from "https://deno.land/x/zipjs/index.js"; window.zip = {HttpReader,BlobWriter, TextWriter, ZipWriter, BlobReader}`
  document.head.appendChild(script)
}

addBulk();

