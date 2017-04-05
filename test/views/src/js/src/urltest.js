import { bindEvent, XAjax } from './utils';
import { state } from './state.js'

const urlList = document.getElementById("urllist");
let urls = document.querySelectorAll('#urllist li');
state.urlList.push(...Array.prototype.map.call(urls, x => ({text: x.innerText.trim(), node:x})));
const urlInput = document.getElementById("customurl");
const addBtn = document.getElementById("addBtn");
const gotoBtn = document.getElementById("gotoBtn");

export const host = gotoBtn.dataset.host;

state.urlList.applyCallback('length', function(val, oldval) {
    if (val) {
        this.dirty = true;
    }
}, 'set');
// console.log(state.urlList);
state.urlList.applyCallback('dirty', function(val) {
    if(val) {
        // only add or remove
        setTimeout(() => {
            // render options
            for(let v of this) {
                if (!v.node) {
                    let node = document.createElement('li');
                    node.innerHTML = `<img src="/static/img/copy.svg"><a href="javascript:void(0);">${v.text}</a>`;
                    urlList.appendChild(node);
                    v.node = node;
                }
                if (!v.converted) {
                    bindEvent(v.node, 'click', (e) => {
                        let url = buildUrl(v.text);
                        let tagname;
                        if((tagname = e.target.tagName.toLowerCase()) === 'a') {
                            state.logList.push({text: `You have click the link to : ${url}`});
                            window.open(url);
                        } else if (tagname === 'img') {
                            window.prompt("Copy to clipboard: Ctrl+C, Enter", url);
                        }

                    });
                    v.converted = true;
                }
            }
            this.dirty = false;
        }, 10);
    }
}, 'set');

state.urlList.dirty = true;

bindEvent(urlList, 'click', (event) => {
    if (!state.injected) {
        alert('请先注入脚本');
        if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
    }
}, true);

bindEvent(addBtn, 'click', (event) => {
    let url = urlInput.value;
    if (state.urlList.find(x => x.text === url)) {
        alert('列表中已存在');
    } else {
        let getJson = new XAjax('/api/test/addurl', {url}, {
            callback(result) {
                if(result.code === 200) {
                    state.urlList.push({text: url});
                } else {
                    alert('添加失败');
                }
            }
        });
        getJson.send();
    }
});


bindEvent(gotoBtn, 'click', (event) => {
	if (state.injected) {
		let url;
	    if (url = urlInput.value) {
	    	window.open(buildUrl(url));
	    }
	} else {
        alert('请先注入脚本');
        if (event.preventDefault) {
            event.preventDefault();
            event.stopPropagation();
        } else {
            event.returnValue = false;
        }
	}
});

function buildUrl(url) {
    let fwdurl = `http://${host}/api/page/html?pageUrl=${encodeURIComponent(url)}&id=${state.socketid}`;
    return fwdurl;
}
