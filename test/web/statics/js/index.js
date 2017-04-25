(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(factory());
}(this, (function () { 'use strict';

var logUl = document.querySelector('.logbox ul');
var clearBtn = document.querySelector('.logbox .clear');
function addLog(v) {
	var node = document.createElement('li');
	node.value = v.text;
	node.innerText = v.text;
	var atag = void 0;
	if (v.data) {
		var a = document.createElement('a');
		a.innerText = 'more';
		node.appendChild(a);
		atag = a;
	}
	logUl.appendChild(node);
	return atag;
}

var urlList = document.getElementById("urllist");
var urlInput = document.getElementById("customurl");
var addBtn = document.getElementById("addBtn");
var gotoBtn = document.getElementById("gotoBtn");

function setUrlList(list) {
    urlList.innerHTML = '';
    var stream = Rx.Observable.empty();
    var streams = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = list[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var v = _step.value;

            var click = inserUrl(v);
            click && streams.push(click);
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }

    var merged = stream.merge.apply(stream, streams);
    return merged;
}
function inserUrl(v) {
    if (!v.node) {
        var node = document.createElement('li');
        node.innerHTML = "<img src=\"/statics/img/copy.svg\"><a href=\"javascript:void(0);\">" + v.text + "</a>";
        urlList.appendChild(node);
        v.node = node;
    }
    if (!v.converted) {
        return setUrlLink(v);
        v.converted = true;
    }
}
function setUrlLink(v) {
    return Rx.Observable.fromEvent(v.node, 'click').map(function (e) {
        var url = buildUrl(v.text);
        var tagname = void 0;
        if ((tagname = e.target.tagName.toLowerCase()) === 'a') {
            window.open(url);
            return { text: "You have click the link to : " + url };
        } else if (tagname === 'img') {
            window.prompt("Copy to clipboard: Ctrl+C, Enter", url);
        }
    });
}

function buildUrl(url) {
    var fwdurl = "//" + window.location.host + "/html?url=" + encodeURIComponent(url);
    return fwdurl;
}

function bindAddClick() {
    return Rx.Observable.fromEvent(addBtn, 'click').map(function (e) {
        return urlInput.value;
    });
}

function bindGotoClick() {
    return Rx.Observable.fromEvent(gotoBtn, 'click').map(function (e) {
        var url = urlInput.value;
        window.open(buildUrl(url));
        return url;
    });
}

var socket = io(window.location.host);
Rx.Observable.fromEvent(socket, 'connect').map(function (x) {
  return { text: 'ready to log from : ' + window.location.host + ' , your socket client id: ' + socket.io.engine.id };
}).map(function (data) {
  return addLog(data);
}).filter(Boolean).subscribe(function (x) {
  return console.log(x);
});
Rx.Observable.fromEvent(socket, 'url').mergeMap(function (url) {
  return inserUrl({ text: url });
}).filter(Boolean).subscribe(function (data) {
  return addLog(data);
});
Rx.Observable.fromEvent(socket, 'urls').map(function (x) {
  return x.map(function (url) {
    return { text: url };
  });
}).mergeMap(function (list) {
  return setUrlList(list);
}).filter(Boolean).subscribe(function (data) {
  return addLog(data);
});
bindAddClick().subscribe(function (x) {
  return socket.emit('addurl', x);
});
bindGotoClick().subscribe(function (text) {
  return addLog({ text: text });
});

})));
//# sourceMappingURL=index.js.map
