const urlList = document.getElementById("urllist");
const urlInput = document.getElementById("customurl");
const addBtn = document.getElementById("addBtn");
const gotoBtn = document.getElementById("gotoBtn");

export function setUrlList(list) {
    urlList.innerHTML = '';
    const stream = Rx.Observable.empty();
    const streams = [];
    for (let v of list) {
        let click = inserUrl(v);
        click && (streams.push(click));
    }
    var merged = stream.merge(...streams);
    return merged;
}
export function inserUrl(v) {
    if (!v.node) {
        let node = document.createElement('li');
        node.innerHTML = `<img src="/statics/img/copy.svg"><a href="javascript:void(0);">${v.text}</a>`;
        urlList.appendChild(node);
        v.node = node;
    }
    if (!v.converted) {
        return setUrlLink(v);
        v.converted = true;
    }
}
export function setUrlLink(v) {
    return Rx.Observable.fromEvent(v.node, 'click').map((e) => {
        let url = buildUrl(v.text);
        let tagname;
        if ((tagname = e.target.tagName.toLowerCase()) === 'a') {
            window.open(url);
            return ({ text: `You have click the link to : ${url}` });
        } else if (tagname === 'img') {
            window.prompt("Copy to clipboard: Ctrl+C, Enter", url);
        }
    })
}

function buildUrl(url) {
    let fwdurl = `//${window.location.host}/html?url=${encodeURIComponent(url)}`;
    return fwdurl;
}

export function bindAddClick() {
    return Rx.Observable.fromEvent(addBtn, 'click').map(e => urlInput.value);
}

export function bindGotoClick() {
    return Rx.Observable.fromEvent(gotoBtn, 'click').map(e => {
        let url = urlInput.value;
        window.open(buildUrl(url));
        return url;
    });
}
