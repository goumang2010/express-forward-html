const fetch = require('node-fetch-custom');
import { RequestFilter, ResponseFilter } from '../interface';
import { Request, Response } from 'node-fetch-custom';
import { nodeOptions } from '../constants';
export * from './request';
export * from './response';

export const buildFilterImplementer = (requestFilter: RequestFilter, responseFilter: ResponseFilter) => async (request: Request, stream?) => {
    let response = await requestFilter(request);
    if (response instanceof Request) {
        response = await fetch(request, {}, nodeOptions, stream);
    }
    return (await responseFilter(response as Response));
};
