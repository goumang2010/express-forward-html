import { Request, Response } from 'node-fetch-custom';
import { IncomingMessage, ServerResponse } from 'http';
import { Url } from 'url';
export type RequestFilter = (req: Request) => Promise<Request | Response>;
export type ResponseFilter = (res: Response) => Promise<Response>;

export type textTransformer = (content: string, req: Request) => string;

export interface Options {
    prefix: string;

    requestFilter: RequestFilter;
    responseFilter: ResponseFilter;
    filterCookie: textTransformer;
    filterHtml: textTransformer;
    filterStatic: textTransformer;
    filterAjax: (body: any, req: Request) => string;
    script: string | ((urlObj: CustomURL) => void);
    isMobileUA?: (url: string, req?: Request) => boolean | string;
    needRedirect?: (url: string, req?: Request) => boolean;
}

export interface ParsedOptions {
    prefix: string;
    filterHtml?: textTransformer;
    filterStatic?: textTransformer;
    filterAjax?: (body: any, req: Request) => string;
    script: string;
    requestAdapter: (x: IncomingMessage) => Request;
    responseAdapter: (x: Response, y: ServerResponse) => void;
    applyCommonFilter: (x: Request, stream?: boolean) => Promise<Response>;
}

export type Handler = (x: ParsedOptions) => (req: IncomingMessage, res: ServerResponse, next: any) => Promise<void>;

export interface CustomURL extends Url {
    mobile: boolean;
    serverUrlObj: Url;
}