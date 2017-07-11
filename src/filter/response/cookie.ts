import { Response } from 'node-fetch-custom';
const filterResCookie = str => str.split(/;\s?/).filter(x => !/^\s*domain/i.test(x)).join(';');
const trimResponseCookie = cookie => (cookie && cookie.split(/,\s?/).map(x => filterResCookie(x)));
export const transformCookie = (res: Response) => {
    const newck = trimResponseCookie(res.headers.get('set-cookie'));
    newck && res.headers.set('set-cookie', newck);
};