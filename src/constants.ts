export enum UAType {
    MOBILE,
    PC
}
export const UA = {
    [UAType.MOBILE]: 'Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1',
    [UAType.PC]: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.71 Safari/537.36'
};

export const idFunc = x => x;
export const falseFunc = () => false;

export const nodeOptions = {
    rejectUnauthorized: false
};