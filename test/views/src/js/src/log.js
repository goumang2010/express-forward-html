import {
	state
} from './state.js';
import {
	bindEvent
} from './utils';
import { host } from './urltest.js';
import { exeInject } from './inject';
const logUl = document.querySelector('.logbox ul');
const clearBtn = document.querySelector('.logbox .clear');
state.logList.applyCallback('length', function(val, oldval) {
	if (val) {
		clearBtn.style.display = "inline-block"
		this.dirty = true;
	} else {
		for (let i = 0; i < oldval; i++) {
			delete this[i];
		}
		logUl.innerHTML = '';
		clearBtn.style.display = 'none';
	}
}, 'set');
state.logList.applyCallback('dirty', function(val) {
	if (val) {
		// only add or remove
		setTimeout(() => {
			// render options
			for (let v of this) {
				if (!v.node) {
					let node = document.createElement('li');
					node.value = v.text;
					node.innerText = v.text;
					if (v.data) {
						let a = document.createElement('a');
						a.innerText = 'more';
						bindEvent(a, 'click', () => {
							state.modal.type = 1;
							state.modal.data = JSON.stringify(v.data, null, 4);
							state.modal.show = true;
						})
						node.appendChild(a);
					}
					logUl.appendChild(node);
					v.node = node;
				} else {
				}
			}
			this.dirty = false;
		}, 10);
	}
}, 'set');
bindEvent(clearBtn, 'click', function() {
	state.logList.length = 0;
})
const socket = io(`http://${host}`);
socket.on('connect', function() {
	state.socketid = this.io.engine.id;
	state.logList.push({ text: `ready to log from : http://${host} , your socket client id: ${state.socketid}` });
	// 页面加载后即注入
	exeInject(false);
});
socket.on('log', function(data) {
	let { UBA, UBAid, spend } = data;
	let text;
	if ((UBA != null) && (UBAid != null)) {
		text = `log received: UBA:${UBA} , UBAid:${UBAid} , spend: ${spend}ms`;
	} else {
		text = spend ? `log received, but no UBA and UBA id found, spend: ${spend}ms` : `log received, but no UBA and UBA id found`;
	}
	state.logList.push({ text, data });
});
socket.on('page', function(data) {
	let { url, mobile } = data;
	let text = `page test, url:${url}, platform:${mobile ? 'H5' : 'PC'}`;
	state.logList.push({ text, data });
});
socket.on('script', function(url) {
	let text = `script has been injected to page, url:${url}`;
	state.logList.push({ text });
});
socket.on('api', function(data) {
	let { span, json, url } = data;
	json = JSON.parse(json || '') || {};
	let text = `page received sdk data: total: ${json && (json = json.data) && json.total}, spend: ${span}ms , url: ${url}`;
	state.logList.push({ text, data: json });
	console.log(json);
});
