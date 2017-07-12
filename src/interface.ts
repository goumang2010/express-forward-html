import { Request, Response } from 'node-fetch-custom';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { Url } from 'url';
export type RequestFilter = (req: FwdRequest) => Promise<FwdRequest | Response>;
export type ResponseFilter = (res: Response) => Promise<Response>;
export type textTransformer = (content: string, req: FwdRequest) => string;
export type HtmlFilter = {
    [regexStr: string]: textTransformer;
} | textTransformer;

export type StaticFilter = HtmlFilter | textTransformer;

export type AjaxFilter = HtmlFilter | textTransformer;

export interface FwdRequest extends Request {
    originalUrlObj?: Url;
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
    filterHtml: HtmlFilter;
    filterStatic: StaticFilter;
    filterAjax: AjaxFilter;
    script: string | ((urlObj: CustomURL) => void);
    isMobileUA?: (url: string, req?: FwdRequest) => boolean | string;
}

export interface ParsedOptions {
    prefix: string;
    filterHtml?: (url: string) => textTransformer;
    filterStatic?: (url: string) => textTransformer;
    filterAjax?: (url: string) => textTransformer;
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