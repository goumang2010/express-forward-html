"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var ajaxHandler = function (_a) {
    var requestAdapter = _a.requestAdapter, responseAdapter = _a.responseAdapter, applyCommonFilter = _a.applyCommonFilter, filterAjax = _a.filterAjax;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var _a, method, headers, body, bodykeys, _i, bodykeys_1, key, oldval, contentType, finalReq, result, text, parsedText, result;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _a = req.method, method = _a === void 0 ? 'get' : _a, headers = req.headers;
                    body = req['body'];
                    // if there is a body-parser
                    if (body) {
                        bodykeys = Object.keys(body || {});
                        if (body && bodykeys.length) {
                            for (_i = 0, bodykeys_1 = bodykeys; _i < bodykeys_1.length; _i++) {
                                key = bodykeys_1[_i];
                                oldval = body[key];
                                body[key] = encodeURI(oldval);
                            }
                            contentType = headers['content-type'];
                            if (contentType && contentType.indexOf('x-www-form-urlencoded') > -1) {
                                body = Object.keys(body).reduce(function (pre, key) {
                                    return (pre + (key + "=" + body[key] + "&"));
                                }, '').slice(0, -1);
                            }
                            else {
                                body = JSON.stringify(body);
                            }
                            req['body'] = body;
                        }
                    }
                    else if (!/get|head/i.test(method)) {
                        // use req stream
                        req['body'] = req;
                    }
                    finalReq = requestAdapter(req);
                    if (!filterAjax) return [3 /*break*/, 3];
                    return [4 /*yield*/, applyCommonFilter(finalReq)];
                case 1:
                    result = _b.sent();
                    return [4 /*yield*/, result.text()];
                case 2:
                    text = _b.sent();
                    responseAdapter(result, res);
                    parsedText = filterAjax(finalReq.url)(text, finalReq);
                    result.headers.delete('content-encoding');
                    res.end(parsedText);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, applyCommonFilter(finalReq, true)];
                case 4:
                    result = _b.sent();
                    responseAdapter(result, res);
                    result.body.pipe(res);
                    _b.label = 5;
                case 5: return [2 /*return*/];
            }
        });
    }); };
};
exports.default = ajaxHandler;
