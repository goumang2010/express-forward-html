'use strict';
import { Options, ParsedOptions } from './interface';
import { idFunc } from './constants';
import { handleError } from './error';
import forwardHtml from './handler/html';
import forwardAjax from './handler/ajax';
import forwardStatic from './handler/static';
import requestAdapter from './adapter/request';
import responseAdapter from './adapter/response';
import { buildFilterImplementer, combineRequestFilter, combineResponseFilter } from './filter';
import * as R from 'ramda';
const buildOptions = (opts: Partial<Options> = {}): ParsedOptions => {
    let {
        prefix = '',
        filterHtml = idFunc,
        filterStatic = idFunc,
        filterAjax,
        script = () => {} } = opts;
    if (script) {
        let scriptType = typeof script;
        if (scriptType === 'function') {
            script = Function.prototype.toString.call(script) as string;
        } else if (scriptType !== 'string') {
            throw new TypeError('The param script must be function or string!');
        } else {
            script = script.toString();
        }
    } else {
        script = '';
    }
    
    prefix !== '' && (prefix.startsWith('/') || (prefix = '/' + prefix));
    const requestFilter = combineRequestFilter(opts);
    const responseFilter = combineResponseFilter(opts);
    const applyCommonFilter = buildFilterImplementer(requestFilter, responseFilter);
    return { prefix, applyCommonFilter, requestAdapter, responseAdapter, filterAjax, filterHtml, filterStatic, script };
};
const wrapAsyncError = (fn) => (req, res, next) => {
    const routePromise = fn(req, res, next);
    if (routePromise && routePromise.catch) {
        routePromise.catch(err => next(err));
    }
};
const registerRouter = R.curry((opts: ParsedOptions, router: any) => {
    let prefix = opts.prefix;
    if (router && router.all) {
        router.get(`${prefix}/html`, wrapAsyncError(forwardHtml(opts)));
        router.all(`${prefix}/ajax`, wrapAsyncError(forwardAjax(opts)));
        router.get(`${prefix}/static`, wrapAsyncError(forwardStatic(opts)));
        router.use(handleError);
    } else {
        throw new TypeError('The param is not express instance or router!');
    }
    return router;
});
module.exports = R.compose(registerRouter, buildOptions);
