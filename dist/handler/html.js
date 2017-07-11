"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
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
var urlLib = require("url");
var fs = require("fs");
var path = require("path");
var xhrProxy = fs.readFileSync(path.resolve(__dirname, '../script/xhr-proxy.js'), { encoding: 'utf8' }).replace("'use strict';", '');
var htmlHandler = function (_a) {
    var prefix = _a.prefix, script = _a.script, requestAdapter = _a.requestAdapter, responseAdapter = _a.responseAdapter, applyCommonFilter = _a.applyCommonFilter, filterHtml = _a.filterHtml;
    return function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
        var finalReq, result, url, serverUrlObj, urlObj, proxytext, rawHtml, html, parsedHtml;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    finalReq = requestAdapter(req);
                    return [4 /*yield*/, applyCommonFilter(finalReq)];
                case 1:
                    result = _a.sent();
                    url = finalReq.url;
                    serverUrlObj = urlLib.parse(finalReq['serverHost'] + req['originalUrl']);
                    urlObj = __assign({}, urlLib.parse(url), { mobile: finalReq['mobile'], UA: finalReq.headers.get('User-Agent'), prefix: prefix, serverUrlObj: serverUrlObj });
                    proxytext = "<script>(" + xhrProxy + "(" + JSON.stringify(urlObj) + ", " + script + "))</script>";
                    return [4 /*yield*/, result.text()];
                case 2:
                    rawHtml = _a.sent();
                    html = filterHtml ? filterHtml(rawHtml, finalReq) : rawHtml;
                    parsedHtml = html.replace('<head>', '<head>' + proxytext)
                        .replace(/(href|src)\s*=\s*"\s*((?!http|\/\/|javascript)[^"'\s]+?)\s*"/g, function (m, p1, p2) {
                        return p1 + "=\"" + urlLib.resolve(url, p2) + "\"";
                    });
                    result.headers.has('content-encoding') && result.headers.set('content-encoding', 'plain/text');
                    responseAdapter(result, res);
                    res.end(parsedHtml);
                    return [2 /*return*/];
            }
        });
    }); };
};
exports.default = htmlHandler;
