import { Request, Response } from 'node-fetch-custom';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Url } from 'url';
export type RequestFilter = (req: FwdRequest) => Promise<FwdRequest | Response>;
export type ResponseFilter = (res: Response) => Promise<Response>;

export type textTransformer = (content: string, req: FwdRequest) => string;

export interface FwdRequest extends Request {
    originUrlObj?: Url;
    mobile?: boolean;
}

export interface FwdResponse extends Response {
    // originUrlObj?: Url;
}
export interface Options {
    prefix: string;

    requestFilter: RequestFilter;
    responseFilter: ResponseFilter;
    filterCookie: textTransformer;
    filterHtml: textTransformer;
    filterStatic: textTransformer;
    filterAjax: (body: any, req: FwdRequest) => string;
    script: string | ((urlObj: CustomURL) => void);
    isMobileUA?: (url: string, req?: FwdRequest) => boolean | string;
    needRedirect?: (url: string, req?: FwdRequest) => boolean;
}

export interface ParsedOptions {
    prefix: string;
    filterHtml?: textTransformer;
    filterStatic?: textTransformer;
    filterAjax?: (body: any, req: FwdRequest) => string;
    script: string;
    requestAdapter: (x: ExpressRequest) => FwdRequest;
    responseAdapter: (x: FwdResponse, y: ExpressResponse) => void;
    applyCommonFilter: (x: FwdRequest, stream?: boolean) => Promise<FwdResponse>;
}

export type Handler = (x: ParsedOptions) => (req: ExpressRequest, res: ExpressResponse, next: any) => Promise<void>;
export type RequestAdapter = (req: ExpressRequest) => FwdRequest;
export type ResponseAdapter = (res: FwdResponse, NodeRes: ExpressResponse) => void;
export interface CustomURL extends Url {
    mobile: boolean;
    serverUrlObj: Url;
}