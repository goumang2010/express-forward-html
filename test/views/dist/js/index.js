(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (factory());
}(this, (function () { 'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};





















var get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

















var set = function set(object, property, value, receiver) {
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent !== null) {
      set(parent, property, value, receiver);
    }
  } else if ("value" in desc && desc.writable) {
    desc.value = value;
  } else {
    var setter = desc.set;

    if (setter !== undefined) {
      setter.call(receiver, value);
    }
  }

  return value;
};















var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var jsonToQuery = function jsonToQuery(a) {
    var add = function add(s, k, v) {
        v = typeof v === 'function' ? v() : v === null ? '' : v === undefined ? '' : v;
        s[s.length] = encodeURIComponent(k) + '=' + encodeURIComponent(v);
    };
    var buildParams = function buildParams(prefix, obj, s) {
        var i = void 0;
        var len = void 0;
        var key = void 0;

        if (Object.prototype.toString.call(obj) === '[object Array]') {
            for (i = 0, len = obj.length; i < len; i++) {
                buildParams(prefix + '[' + (_typeof(obj[i]) === 'object' ? i : '') + ']', obj[i], s);
            }
        } else if (obj && obj.toString() === '[object Object]') {
            for (key in obj) {
                if (obj.hasOwnProperty(key)) {
                    if (prefix) {
                        buildParams(prefix + '[' + key + ']', obj[key], s, add);
                    } else {
                        buildParams(key, obj[key], s, add);
                    }
                }
            }
        } else if (prefix) {
            add(s, prefix, obj);
        } else {
            for (key in obj) {
                add(s, key, obj[key]);
            }
        }
        return s;
    };
    return buildParams('', a, []).join('&').replace(/%20/g, '+');
};

var JSONParse = function () {
    if (window.JSON) {
        return JSON.parse;
    } else {
        return function (jsonstr) {
            return new Function("return" + jsonstr)();
        };
    }
}();

var isMobile = function () {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch (e) {
        return false;
    }
}();

var bindEvent = function bindEvent(element, event, cb, capture) {
    !element.addEventListener && (event = 'on' + event);
    (element.addEventListener || element.attachEvent).call(element, event, cb, capture);
    return cb;
};

var win = typeof window !== 'undefined' ? window : self;
// Get XMLHttpRequest object
var xdr = void 0;
var getXHR = win.XMLHttpRequest ? function () {
    return new win.XMLHttpRequest();
} : function () {
    return new win.ActiveXObject('Microsoft.XMLHTTP');
};
var mimeTypes = {
    text: '*/*',
    xml: 'text/xml',
    json: 'application/json',
    post: 'application/x-www-form-urlencoded',
    document: 'text/html'
};

var xhr2 = getXHR().responseType === '';

function XAjax(url, data, options) {
    var headers = {
        Accept: '*/*',
        'Cache-Control': ''
    };
    if (options.headers && Object.prototype.toString.call(options.headers).includes('Object')) {
        Object.assign(headers, options.headers);
    }
    this.callback = options.callback;
    var method = options.method && options.method.toLowerCase() || 'get';
    this.url = url;
    if (data) {
        if (method === 'get') {
            this.url = url + '?' + jsonToQuery(data);
        } else {
            // Prepare data
            // default datatype
            var dataType = options.dataType || 'post';
            if ('ArrayBuffer' in win && data instanceof ArrayBuffer) {
                dataType = 'arraybuffer';
            } else if ('Blob' in win && data instanceof Blob) {
                dataType = 'blob';
            } else if ('Document' in win && data instanceof Document) {
                dataType = 'document';
            } else if ('FormData' in win && data instanceof FormData) {
                dataType = 'formdata';
            }
            if (!('Content-Type' in headers)) {
                if (dataType in mimeTypes) {
                    if (mimeTypes[dataType]) {
                        headers['Content-Type'] = mimeTypes[dataType];
                    }
                }
            }
            switch (dataType) {
                case 'json':
                    data = JSON.stringify(data);
                    break;
                case 'post':
                    data = jsonToQuery(data);
            }
            this.data = data;
        }
    } else {
        this.data = {};
    }

    this.errHandler = options.errHandler || function (msg) {
        console.log('error: ' + msg);
    };
    // Prepare URL

    this.options = {
        _async: true,
        timeout: 30000,
        attempts: 2
    };
    this.attempts = 0;
    this.aborted = false;
    // timeout id
    this.timeoutid = null;
    // Guess if we're dealing with a cross-origin request
    var i = url.match(/\/\/(.+?)\//);
    this.crossOrigin = i && (i[1] ? i[1] !== location.host : false);
    if (!this.crossOrigin && !('X-Requested-With' in headers)) {
        // (that header breaks in legacy browsers with CORS)
        headers['X-Requested-With'] = 'XMLHttpRequest';
    }
    this.headers = headers;
    this.method = method;
}

XAjax.prototype.abort = function () {
    if (!this.aborted) {
        if (this.xhr && this.xhr.readyState !== 4) {
            // https://stackoverflow.com/questions/7287706/ie-9-javascript-error-c00c023f
            this.xhr.abort();
        }
        this.aborted = true;
    }
};

XAjax.prototype.handleResponse = function () {
    var xhr = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this.xhr;

    clearTimeout(this.timeoutid);
    // Verify if the request has not been previously aborted
    if (this.aborted) {
        return;
    }
    // Handle response
    try {
        // Process response
        if (xhr.responseType === 'json') {
            if ('response' in xhr && xhr.response === null) {
                throw 'The request response is empty';
            }
            this.response = xhr.response;
        } else {
            this.response = JSONParse(xhr.responseText);
        }
        // Late status code verification to allow passing data when, per example, a 409 is returned
        // --- https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
        if ('status' in xhr && !/^2|1223/.test(xhr.status)) {
            throw xhr.status + ' (' + xhr.statusText + ')';
        }
        // Fulfilled
        this.callback(this.response);
    } catch (e) {
        // Rejected
        this.handleError(e);
    }
};

XAjax.prototype.handleTimeout = function () {
    if (!this.aborted) {
        if (!this.options.attempts || ++this.attempts !== this.options.attempts) {
            this.xhr.abort();
            this.send();
        } else {
            this.handleError({
                message: 'Timeout (' + this.url + ')'
            });
        }
    }
};

XAjax.prototype.handleError = function (e) {
    console.log(e);
    var message = e && e.message;
    if (!this.aborted) {
        message = typeof message === 'string' ? message : 'Connection aborted';
        this.abort();
        this.errHandler(message);
    }
};

XAjax.prototype.send = function () {
    var _this = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$method = _ref.method,
        method = _ref$method === undefined ? this.method : _ref$method,
        _ref$url = _ref.url,
        url = _ref$url === undefined ? this.url : _ref$url,
        _ref$options = _ref.options,
        options = _ref$options === undefined ? this.options : _ref$options,
        _ref$headers = _ref.headers,
        headers = _ref$headers === undefined ? this.headers : _ref$headers;

    // Get XHR object
    var xhr = getXHR();
    if (this.crossOrigin && win.XDomainRequest) {
        xhr = new XDomainRequest(); // CORS with IE8/9
        xdr = true;
    }
    // Open connection
    if (xdr) {
        xhr.open(method, url);
    } else {
        xhr.open(method, url, options._async);
    }
    this.xhr = xhr;

    // Set headers
    if (!xdr) {
        for (var i in headers) {
            if (headers[i]) {
                xhr.setRequestHeader(i, headers[i]);
            }
        }
    }

    // Plug response handler
    if (xhr2 || xdr) {
        xhr.onload = function () {
            _this.handleResponse.apply(_this);
        };
        xhr.onerror = function () {
            _this.handleError.apply(_this);
        };
        // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
        if (xdr) {
            xhr.onprogress = function () {};
        }
    } else {
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                _this.handleResponse.apply(_this);
            }
        };
    }
    // Plug timeout
    if (options._async) {
        if ('timeout' in xhr) {
            xhr.timeout = options.timeout;
            xhr.ontimeout = function () {
                _this.handleTimeout.apply(_this);
            };
        } else {
            this.timeoutid = setTimeout(function () {
                _this.handleTimeout.apply(_this);
            }, options.timeout);
        }
        // http://cypressnorth.com/programming/internet-explorer-aborting-ajax-requests-fixed/
    } else if (xdr) {
        xhr.ontimeout = function () {};
    }

    // Send request
    if (xdr) {
        // https://developer.mozilla.org/en-US/docs/Web/API/XDomainRequest
        setTimeout(function () {
            xhr.send(this.method !== 'get' ? this.data : null);
        }, 0);
    } else {
        xhr.send(this.method !== 'get' ? this.data : null);
    }
};

var __proto__ = Object.create(null);
__proto__.applyCallback = function applyCallback(key, func, type) {
    var _this = this;

    var property = Object.getOwnPropertyDescriptor(this, key);
    if (property && property.configurable === false) {
        return;
    }

    var getter = property && property.get;
    var _value = void 0;
    getter ? _value = getter.call(this) : _value = property && property.value;

    var setter = property && property.set;
    var newProperty = {
        enumerable: true,
        configurable: true
    };
    if (type === 'get') {
        getter ? newProperty.get = function () {
            var oldval = getter.call(_this);
            var val = func.call(_this, _value, oldval);
            if (val != null) {
                return val;
            } else {
                return _value;
            }
        } : newProperty.get = function () {
            var val = func.call(_this);
            if (val != null) {
                return val;
            } else {
                return _value;
            }
        };
        if (!setter) {
            newProperty.set = function (val) {
                _value = val;
            };
        }
    } else if (type === 'set') {
        setter ? newProperty.set = function (val) {
            setter.call(_this, val);
            func.call(_this, val);
        } : newProperty.set = function (val) {
            var oldval = _value;
            _value = val;
            func.call(_this, val, oldval);
        };
        if (!getter) {
            newProperty.get = function () {
                return _value;
            };
        }
    }
    Object.defineProperty(this, key, newProperty);
};

var arrayproto = [];
Object.assign(arrayproto, __proto__);

var state = {
    __proto__: __proto__,
    // 0 -> mock, 1-> forward
    fetch: 1,
    injected: false,
    socketid: null,
    mockList: { __proto__: arrayproto, length: 0, dirty: false },
    urlList: { __proto__: arrayproto, length: 0 },
    logList: { __proto__: arrayproto, length: 0 },
    modal: {
        __proto__: __proto__,
        show: false,
        // 0 -> edit/add mock json ,1 -> view obj
        type: 0,
        title: '',
        data: ''
    }
};

var _state$mockList;

var editMockBtn = document.getElementById('editDataBtn');
var addMockBtn = document.getElementById('addDataBtn');
var delMockBtn = document.getElementById('delDataBtn');

var injectBtn = document.getElementById('injectBtn');
var dataSelect = document.getElementById('dataSelect');

var datalist = document.querySelectorAll('#dataSelect option');

(_state$mockList = state.mockList).push.apply(_state$mockList, toConsumableArray(Array.prototype.map.call(datalist, function (x) {
    return x.innerText;
})));
state.mockList.current = 0;

var projectInput = document.getElementById('project');
var fetchInput = document.getElementById('fetchurl');
var mockFetch = document.getElementById('mockfetch');
var reportInput = document.getElementById('reporturl');
var mockReport = document.getElementById('mockreport');

state.applyCallback('fetch', function (isforward) {
    if (isforward) {
        dataSelect.setAttribute('disabled', true);
        editMockBtn.setAttribute('disabled', true);
        addMockBtn.setAttribute('disabled', true);
        delMockBtn.setAttribute('disabled', true);
    } else {
        dataSelect.removeAttribute('disabled');
        editMockBtn.removeAttribute('disabled');
        addMockBtn.removeAttribute('disabled');
        delMockBtn.removeAttribute('disabled');
    }
}, 'set');
state.fetch = 1;

state.mockList.applyCallback('length', function (val) {
    this.dirty = true;
}, 'set');

state.mockList.applyCallback('dirty', function (val) {
    var _this = this;

    if (val) {
        setTimeout(function () {
            // render options
            dataSelect.innerHTML = '';
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _this[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var v = _step.value;

                    if (v) {
                        var node = document.createElement('option');
                        node.value = v;
                        node.innerText = v;
                        dataSelect.appendChild(node);
                    }
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

            _this.dirty = false;
            dataSelect.selectedIndex = state.mockList.current || 0;
        }, 10);
    }
}, 'set');

function exeInject() {
    var notify = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

    var data = {
        project: projectInput.value,
        orginApi: JSON.stringify({
            fetch: fetchInput.value,
            report: reportInput.value
        }),
        mockApi: JSON.stringify({
            fetch: mockFetch.value,
            report: mockReport.value
        }),
        socketid: state.socketid
    };
    var getJson = new XAjax('/api/inject', data, {
        method: 'post',
        callback: function callback(result) {
            if (result.code === 200) {
                state.injected = true;
                notify && alert('注入成功');
            } else {
                alert('注入失败，请查看控制台打印的结果');
            }

            console.log(result);
        }
    });
    getJson.send();
}

function setMock(filename) {
    var getJson = new XAjax('/api/task/setmock', {
        filename: filename
    }, {
        callback: function callback(result) {
            if (result.code !== 200) {
                alert('mock数据设置失败，请查看控制台打印的结果');
                console.log(result);
            }
        }
    });
    getJson.send();
}

bindEvent(editMockBtn, 'click', function (event) {
    state.modal.type = 0;
    state.modal.title = dataSelect.value;
    state.modal.show = true;
});

bindEvent(addMockBtn, 'click', function (event) {
    state.modal.type = 0;
    state.modal.show = true;
    state.modal.title = '';
    // state.mockList.current = state.mockList.length;
    // state.mockList.push('');
});

bindEvent(injectBtn, 'click', function (event) {
    exeInject();
    if (dataSelect.getAttribute('disabled') == null) {
        setMock(dataSelect.value);
    }
    if (event.preventDefault) {
        event.preventDefault();
        event.stopPropagation();
    } else {
        event.returnValue = false;
    }
});

bindEvent(dataSelect, 'change', function (event) {
    state.mockList.current = dataSelect.selectedIndex;
});

bindEvent(mockFetch, 'change', function (event) {
    state.fetch = mockFetch.value.includes('forward') ? 1 : 0;
});

var _state$urlList;

var urlList = document.getElementById("urllist");
var urls = document.querySelectorAll('#urllist li');
(_state$urlList = state.urlList).push.apply(_state$urlList, toConsumableArray(Array.prototype.map.call(urls, function (x) {
    return { text: x.innerText.trim(), node: x };
})));
var urlInput = document.getElementById("customurl");
var addBtn = document.getElementById("addBtn");
var gotoBtn = document.getElementById("gotoBtn");

var host = gotoBtn.dataset.host;

state.urlList.applyCallback('length', function (val, oldval) {
    if (val) {
        this.dirty = true;
    }
}, 'set');
// console.log(state.urlList);
state.urlList.applyCallback('dirty', function (val) {
    var _this = this;

    if (val) {
        // only add or remove
        setTimeout(function () {
            // render options
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                var _loop = function _loop() {
                    var v = _step.value;

                    if (!v.node) {
                        var node = document.createElement('li');
                        node.innerHTML = '<img src="/static/img/copy.svg"><a href="javascript:void(0);">' + v.text + '</a>';
                        urlList.appendChild(node);
                        v.node = node;
                    }
                    if (!v.converted) {
                        bindEvent(v.node, 'click', function (e) {
                            var url = buildUrl(v.text);
                            var tagname = void 0;
                            if ((tagname = e.target.tagName.toLowerCase()) === 'a') {
                                state.logList.push({ text: 'You have click the link to : ' + url });
                                window.open(url);
                            } else if (tagname === 'img') {
                                window.prompt("Copy to clipboard: Ctrl+C, Enter", url);
                            }
                        });
                        v.converted = true;
                    }
                };

                for (var _iterator = _this[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    _loop();
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

            _this.dirty = false;
        }, 10);
    }
}, 'set');

state.urlList.dirty = true;

bindEvent(urlList, 'click', function (event) {
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

bindEvent(addBtn, 'click', function (event) {
    var url = urlInput.value;
    if (state.urlList.find(function (x) {
        return x.text === url;
    })) {
        alert('列表中已存在');
    } else {
        var getJson = new XAjax('/api/test/addurl', { url: url }, {
            callback: function callback(result) {
                if (result.code === 200) {
                    state.urlList.push({ text: url });
                } else {
                    alert('添加失败');
                }
            }
        });
        getJson.send();
    }
});

bindEvent(gotoBtn, 'click', function (event) {
    if (state.injected) {
        var url = void 0;
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
    var fwdurl = 'http://' + host + '/api/page/html?pageUrl=' + encodeURIComponent(url) + '&id=' + state.socketid;
    return fwdurl;
}

var logUl = document.querySelector('.logbox ul');
var clearBtn = document.querySelector('.logbox .clear');
state.logList.applyCallback('length', function (val, oldval) {
	if (val) {
		clearBtn.style.display = "inline-block";
		this.dirty = true;
	} else {
		for (var i = 0; i < oldval; i++) {
			delete this[i];
		}
		logUl.innerHTML = '';
		clearBtn.style.display = 'none';
	}
}, 'set');
state.logList.applyCallback('dirty', function (val) {
	var _this = this;

	if (val) {
		// only add or remove
		setTimeout(function () {
			// render options
			var _iteratorNormalCompletion = true;
			var _didIteratorError = false;
			var _iteratorError = undefined;

			try {
				var _loop = function _loop() {
					var v = _step.value;

					if (!v.node) {
						var node = document.createElement('li');
						node.value = v.text;
						node.innerText = v.text;
						if (v.data) {
							var a = document.createElement('a');
							a.innerText = 'more';
							bindEvent(a, 'click', function () {
								state.modal.type = 1;
								state.modal.data = JSON.stringify(v.data, null, 4);
								state.modal.show = true;
							});
							node.appendChild(a);
						}
						logUl.appendChild(node);
						v.node = node;
					} else {}
				};

				for (var _iterator = _this[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
					_loop();
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

			_this.dirty = false;
		}, 10);
	}
}, 'set');
bindEvent(clearBtn, 'click', function () {
	state.logList.length = 0;
});
var socket = io('http://' + host);
socket.on('connect', function () {
	state.socketid = this.io.engine.id;
	state.logList.push({ text: 'ready to log from : http://' + host + ' , your socket client id: ' + state.socketid });
	// 页面加载后即注入
	exeInject(false);
});
socket.on('log', function (data) {
	var UBA = data.UBA,
	    UBAid = data.UBAid,
	    spend = data.spend;

	var text = void 0;
	if (UBA != null && UBAid != null) {
		text = 'log received: UBA:' + UBA + ' , UBAid:' + UBAid + ' , spend: ' + spend + 'ms';
	} else {
		text = spend ? 'log received, but no UBA and UBA id found, spend: ' + spend + 'ms' : 'log received, but no UBA and UBA id found';
	}
	state.logList.push({ text: text, data: data });
});
socket.on('page', function (data) {
	var url = data.url,
	    mobile = data.mobile;

	var text = 'page test, url:' + url + ', platform:' + (mobile ? 'H5' : 'PC');
	state.logList.push({ text: text, data: data });
});
socket.on('script', function (url) {
	var text = 'script has been injected to page, url:' + url;
	state.logList.push({ text: text });
});
socket.on('api', function (data) {
	var span = data.span,
	    json = data.json,
	    url = data.url;

	json = JSON.parse(json || '') || {};
	var text = 'page received sdk data: total: ' + (json && (json = json.data) && json.total) + ', spend: ' + span + 'ms , url: ' + url;
	state.logList.push({ text: text, data: json });
	console.log(json);
});

var modalBox = document.querySelector('.modal#dataModal');
var textarea = document.querySelector('.modal#dataModal textarea#jsonData');
var modalTitle = document.querySelector('.modal#dataModal .modal-title');
var nameInput = document.querySelector('.modal#dataModal .form-filename input');
var nameLengthSpan = document.querySelector('.modal#dataModal .form-filename span');
var nameEditBtn = document.querySelector('.modal#dataModal .form-filename .btn');

var modalFooter = document.querySelector('.modal#dataModal .modal-footer');

var applyBtn = document.querySelector('.modal#dataModal #apply');
var cancelBtn = document.querySelector('.modal#dataModal #cancel');
var closeBtn = document.querySelector('.modal#dataModal .close');

state.modal.applyCallback('show', function (val) {
    if (val) {
        modalBox.classList.remove("fade");
        modalBox.style.display = "block";
        if (this.type === 0 && this.title) {
            modalTitle.style.display = "inline-block";
            nameEditBtn.style.display = "inline-block";
            modalFooter.style.display = "block";
            if (this.title) {
                fetchJsonData(state.modal.title);
            }
        } else if (this.type === 1) {
            modalTitle.style.display = "none";
            nameEditBtn.style.display = "none";
            modalFooter.style.display = "none";
        }
    } else {
        modalBox.classList.add("fade");
        modalBox.style.display = "none";
    }
}, 'set');

state.modal.applyCallback('title', function (val) {
    modalTitle.innerText = '\u4FEE\u6539\u6570\u636E - ' + val;
    if (val === '') {
        
        filenameState.editting = true;
    }
}, 'set');

state.modal.applyCallback('data', function (val) {
    textarea.value = val;
}, 'set');

var filenameState = {
    __proto__: __proto__,
    editting: false,
    length: 0
};

filenameState.applyCallback('length', function (val) {
    nameLengthSpan.innerText = val + '/20';
}, 'set');

filenameState.applyCallback('editting', function (val) {
    if (val) {
        nameInput.style.display = "inline-block";
        nameLengthSpan.style.display = "inline-block";
        nameInput.value = state.modal.title;
        filenameState.length = state.modal.title.length;
        // 防止与alert冲突
        setTimeout(function () {
            nameInput.focus();
        }, 100);
    } else {
        nameInput.style.display = "none";
        nameLengthSpan.style.display = "none";
    }
}, 'set');

function fetchJsonData(filename) {
    var getJson = new XAjax('/api/task/mock', {
        filename: filename,
        tag: 1
    }, {
        callback: function callback(result) {
            state.modal.data = JSON.stringify(result, null, 4);
        }
    });
    getJson.send();
}

function saveJsonData() {
    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : { callback: null, close: true },
        _callback = _ref.callback,
        close = _ref.close;

    var filename = state.modal.title;

    if (filename === '') {
        alert('文件名不能为空');
        state.modal.title = '';
        return;
    }
    var getJson = new XAjax('/api/task/savemock', {
        filename: filename,
        mockdata: textarea.value
    }, {
        method: 'post',
        callback: function callback(result) {
            if (result.code === 200) {

                if (close) {
                    state.modal.show = false;
                }
                if (_callback) {
                    _callback();
                } else {
                    alert('保存成功');
                }
                // location.reload(true);
            } else {
                alert('保存失败');
                console.log(result);
            }
        }
    });
    getJson.send();
}

bindEvent(nameInput, 'blur', function (event) {
    var newname = nameInput.value;
    if (newname === '') {
        alert('必须有文件名');
        return false;
    }
    var oldname = void 0;

    if (newname !== (oldname = state.modal.title)) {
        if (oldname) {
            // rename
            var option = {
                callback: function callback(result) {
                    if (result.code === 200) {
                        state.modal.title = newname;
                        state.mockList[state.mockList.current] = newname;
                        state.mockList.dirty = true;
                        filenameState.editting = false;
                    } else {
                        alert('保存失败');
                        console.log(result);
                    }
                },
                method: 'post'
            };
            var postName = new XAjax('/api/task/renamemock', {
                oldname: oldname,
                newname: newname
            }, option);
            postName.send();
        } else {
            // 新建文件
            if (state.mockList.includes(newname)) {
                alert('已存在相同文件名');
            } else {
                state.modal.title = newname;
                saveJsonData({ close: false, callback: function callback() {
                        state.mockList.push(newname);
                        state.mockList.current = state.mockList.length - 1;
                        filenameState.editting = false;
                    } });
            }
        }
    }
});

bindEvent(nameInput, 'input', function (event) {
    filenameState.length = nameInput.value.length;
});

bindEvent(nameEditBtn, 'click', function (event) {
    filenameState.editting = true;
});

bindEvent(applyBtn, 'click', function (event) {
    saveJsonData();
});

bindEvent(cancelBtn, 'click', function (event) {
    state.modal.show = false;
});

bindEvent(closeBtn, 'click', function (event) {
    state.modal.show = false;
});

// import './polyfills';

})));
//# sourceMappingURL=index.js.map
