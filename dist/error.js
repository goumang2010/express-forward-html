"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var ForwardError = (function (_super) {
    __extends(ForwardError, _super);
    function ForwardError(message, statusCode, systemError) {
        var _this = _super.call(this, message) || this;
        _this.message = message;
        _this.statusCode = statusCode;
        // when err.type is `system`, err.code contains system error code
        if (systemError) {
            _this.code = _this.errno = systemError.code;
        }
        // hide custom error implementation details from end-users
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return ForwardError;
}(Error));
exports.ForwardError = ForwardError;
exports.handleError = function (e, req, res, next) {
    if (process.env.NODE_ENV !== 'production') {
        throw e;
    }
    console.error(e);
    res.status(e.statusCode || 500).end("Error happend: " + e.toString());
};
