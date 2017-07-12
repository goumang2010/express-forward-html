import { Response } from 'node-fetch-custom';
const filterResCookie = str => str.split(/;\s?/).filter(x => !/^\s*domain/i.test(x)).join(';');
const trimResponseCookie = cookie => (cookie && cookie.map(x => filterResCookie(x)));
export const transformCookie = (res: Response) => {
    const headers = res.headers['raw']();
    const newck = trimResponseCookie(headers['set-cookie']);
    newck && (headers['set-cookie'] = newck);
};