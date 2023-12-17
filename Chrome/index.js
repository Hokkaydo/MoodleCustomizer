var keepAliveIntervalId;
var keepAliveEnabled = localStorage.getItem("keepAlive") !== 'false';
var sesskey = '';
var moodleURLBase = ''

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.keepAlive) {
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
    if (sesskey === '') {
        setupSesskey(() => {
            if (keepAliveEnabled) {
                runKeepAlive();
            }
        })
    } else {
        if (keepAliveEnabled) {
            runKeepAlive();
        }
    }

}

function setupSesskey(callback) {
    const script = document.createElement('script');
    script.src = chrome.runtime.getURL("retrieveVariables.js");
    script.onload = function () {
        script.remove();
    }
    document.addEventListener("RetrieveVariable", e => {
        const detail = e.detail;
        if (detail.split("=")[0] === 'sesskey' && sesskey === '') {
            sesskey = detail.split("=")[1];
            callback();
        }
    })
    document.documentElement.appendChild(script);

}

function runKeepAlive() {
    console.log("ran")
    if(moodleURLBase === '') {
        return;
    }
    if (sesskey === '') {
        setupSesskey(() => runKeepAlive());
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
        fetch(moodleURLBase + "/lib/ajax/service.php?sesskey=" + sesskey, fetchOptions)
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
    let links = Array.from(document.getElementsByTagName("a"))
        //moodle adds by its own an hidden "Fichier" text inside <a> linking a file. it's convenient.
        .filter(x => x.innerText.includes("Fichier") && x.className.includes("aalink"))
   
    let folders = Array.from(document.getElementsByTagName("a"))
        //moodle adds by its own an hidden "Dossier" text inside <a> linking a folder. it's convenient.
        .filter(x => x.innerText.includes("Dossier") && x.className.includes("aalink"))
   
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

            
    let files = [];
    for (let link of links) {
        if (allOfThem || link[1]) {
            files.push((await fetch(link[0].href)))
            console.log("Downloaded ", link[0].innerText.split("\n")[0]);
        }
    }
    //downloadZip is coming from client-zip library.
    const blob = await downloadZip(files).blob()
    let url = URL.createObjectURL(blob);
    const courseName = document.getElementsByClassName("page-header-headings")[0].innerText;
    download(url, courseName+"-bulk.zip")

    
}

function addBulk() {
    if (!(document.location.href.includes("course") && document.location.href.includes("view"))) {
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


//client-zip.js
var downloadZip=(()=>{"stream"in Blob.prototype||Object.defineProperty(Blob.prototype,"stream",{value(){return new Response(this).body}}),"setBigUint64"in DataView.prototype||Object.defineProperty(DataView.prototype,"setBigUint64",{value(e,n,t){const r=Number(0xffffffffn&n),i=Number(n>>32n);this.setUint32(e+(t?0:4),r,t),this.setUint32(e+(t?4:0),i,t)}});var f=e=>new DataView(new ArrayBuffer(e)),o=e=>new Uint8Array(e.buffer||e),a=e=>(new TextEncoder).encode(String(e)),s=e=>Math.min(4294967295,Number(e)),u=e=>Math.min(65535,Number(e));function l(e,n){if(void 0===n||n instanceof Date||(n=new Date(n)),e instanceof File)return{isFile:1,t:n||new Date(e.lastModified),i:e.stream()};if(e instanceof Response)return{isFile:1,t:n||new Date(e.headers.get("Last-Modified")||Date.now()),i:e.body};if(void 0===n)n=new Date;else if(isNaN(n))throw new Error("Invalid modification date.");if(void 0===e)return{isFile:0,t:n};if("string"==typeof e)return{isFile:1,t:n,i:a(e)};if(e instanceof Blob)return{isFile:1,t:n,i:e.stream()};if(e instanceof Uint8Array||e instanceof ReadableStream)return{isFile:1,t:n,i:e};if(e instanceof ArrayBuffer||ArrayBuffer.isView(e))return{isFile:1,t:n,i:o(e)};if(Symbol.asyncIterator in e)return{isFile:1,t:n,i:d(e[Symbol.asyncIterator]())};throw new TypeError("Unsupported input format.")}function d(e,n=e){return new ReadableStream({async pull(n){let t=0;for(;n.desiredSize>t;){const r=await e.next();if(!r.value){n.close();break}{const e=y(r.value);n.enqueue(e),t+=e.byteLength}}},cancel(e){n.throw?.(e)}})}function y(e){return"string"==typeof e?a(e):e instanceof Uint8Array?e:o(e)}function b(e,n,t){let[r,i]=function(e){return e?e instanceof Uint8Array?[e,1]:ArrayBuffer.isView(e)||e instanceof ArrayBuffer?[o(e),1]:[a(e),0]:[void 0,0]}(n);if(e instanceof File)return{o:B(r||a(e.name)),u:BigInt(e.size),l:i};if(e instanceof Response){const n=e.headers.get("content-disposition"),f=n&&n.match(/;\s*filename\*?=["']?(.*?)["']?$/i),o=f&&f[1]||e.url&&new URL(e.url).pathname.split("/").findLast(Boolean),s=o&&decodeURIComponent(o),u=t||+e.headers.get("content-length");return{o:B(r||a(s)),u:BigInt(u),l:i}}return r=B(r,void 0!==e||void 0!==t),"string"==typeof e?{o:r,u:BigInt(a(e).length),l:i}:e instanceof Blob?{o:r,u:BigInt(e.size),l:i}:e instanceof ArrayBuffer||ArrayBuffer.isView(e)?{o:r,u:BigInt(e.byteLength),l:i}:{o:r,u:w(e,t),l:i}}function w(e,n){return n>-1?BigInt(n):e?void 0:0n}function B(e,n=1){if(!e||e.every((c=>47===c)))throw new Error("The file must have a name.");if(n)for(;47===e[e.length-1];)e=e.subarray(0,-1);else 47!==e[e.length-1]&&(e=new Uint8Array([...e,47]));return e}var p=new Uint32Array(256);for(let e=0;e<256;++e){let n=e;for(let e=0;e<8;++e)n=n>>>1^(1&n&&3988292384);p[e]=n}function g(e,n=0){n^=-1;for(var t=0,r=e.length;t<r;t++)n=n>>>8^p[255&n^e[t]];return(-1^n)>>>0}function v(e,n,t=0){const r=e.getSeconds()>>1|e.getMinutes()<<5|e.getHours()<<11,i=e.getDate()|e.getMonth()+1<<5|e.getFullYear()-1980<<9;n.setUint16(t,r,1),n.setUint16(t+2,i,1)}function I({o:e,l:n},t){return 8*(!n||(t??function(e){try{h.decode(e)}catch{return 0}return 1}(e)))}var h=new TextDecoder("utf8",{fatal:1});function D(e,n=0){const t=f(30);return t.setUint32(0,1347093252),t.setUint32(4,754976768|n),v(e.t,t,10),t.setUint16(26,e.o.length,1),o(t)}async function*S(e){let{i:n}=e;if("then"in n&&(n=await n),n instanceof Uint8Array)yield n,e.m=g(n,0),e.u=BigInt(n.length);else{e.u=0n;const t=n.getReader();for(;;){const{value:n,done:r}=await t.read();if(r)break;e.m=g(n,e.m),e.u+=BigInt(n.length),yield n}}}function A(e,n){const t=f(16+(n?8:0));return t.setUint32(0,1347094280),t.setUint32(4,e.isFile?e.m:0,1),n?(t.setBigUint64(8,e.u,1),t.setBigUint64(16,e.u,1)):(t.setUint32(8,s(e.u),1),t.setUint32(12,s(e.u),1)),o(t)}function N(e,n,t=0,r=0){const i=f(46);return i.setUint32(0,1347092738),i.setUint32(4,755182848),i.setUint16(8,2048|t),v(e.t,i,12),i.setUint32(16,e.isFile?e.m:0,1),i.setUint32(20,s(e.u),1),i.setUint32(24,s(e.u),1),i.setUint16(28,e.o.length,1),i.setUint16(30,r,1),i.setUint16(40,e.isFile?33204:16893,1),i.setUint32(42,s(n),1),o(i)}function U(e,n,t){const r=f(t);return r.setUint16(0,1,1),r.setUint16(2,t-4,1),16&t&&(r.setBigUint64(4,e.u,1),r.setBigUint64(12,e.u,1)),r.setBigUint64(t-8,n,1),o(r)}function x(e){return e instanceof File||e instanceof Response?[[e],[e]]:[[e.input,e.name,e.size],[e.input,e.lastModified]]}var F=e=>function(e){let n=BigInt(22),t=0n,r=0;for(const i of e){if(!i.o)throw new Error("Every file must have a non-empty name.");if(void 0===i.u)throw new Error(`Missing size for file "${(new TextDecoder).decode(i.o)}".`);const e=i.u>=0xffffffffn,f=t>=0xffffffffn;t+=BigInt(46+i.o.length+(e&&8))+i.u,n+=BigInt(i.o.length+46+(12*f|28*e)),r||(r=e)}return(r||t>=0xffffffffn)&&(n+=BigInt(76)),n+t}(function*(e){for(const n of e)yield b(...x(n)[0])}(e));return function(e,n={}){const t={"Content-Type":"application/zip","Content-Disposition":"attachment"};return("bigint"==typeof n.length||Number.isInteger(n.length))&&n.length>0&&(t["Content-Length"]=String(n.length)),n.metadata&&(t["Content-Length"]=String(F(n.metadata))),new Response(function(e,n={}){const t=function(e){const n=e[Symbol.iterator in e?Symbol.iterator:Symbol.asyncIterator]();return{async next(){const e=await n.next();if(e.done)return e;const[t,r]=x(e.value);return{done:0,value:Object.assign(l(...r),b(...t))}},throw:n.throw?.bind(n),[Symbol.asyncIterator](){return this}}}(e);return d(async function*(e,n){const t=[];let r=0n,i=0n,a=0;for await(const f of e){const e=I(f,n.buffersAreUTF8);yield D(f,e),yield f.o,f.isFile&&(yield*S(f));const o=f.u>=0xffffffffn,s=12*(r>=0xffffffffn)|28*o;yield A(f,o),t.push(N(f,r,e,s)),t.push(f.o),s&&t.push(U(f,r,s)),o&&(r+=8n),i++,r+=BigInt(46+f.o.length)+f.u,a||(a=o)}let l=0n;for(const e of t)yield e,l+=BigInt(e.length);if(a||r>=0xffffffffn){const e=f(76);e.setUint32(0,1347094022),e.setBigUint64(4,BigInt(44),1),e.setUint32(12,755182848),e.setBigUint64(24,i,1),e.setBigUint64(32,i,1),e.setBigUint64(40,l,1),e.setBigUint64(48,r,1),e.setUint32(56,1347094023),e.setBigUint64(64,r+l,1),e.setUint32(72,1,1),yield o(e)}const d=f(22);d.setUint32(0,1347093766),d.setUint16(8,u(i),1),d.setUint16(10,u(i),1),d.setUint32(12,s(l),1),d.setUint32(16,s(r),1),yield o(d)}(t,n),t)}(e,n),{headers:t})}})();

