export class ForwardError extends Error {
    statusCode: number;
    code: number;
    errno: number;
    constructor(message, statusCode?, systemError?) {
        super(message);
        this.message = message;
        this.statusCode = statusCode;
        // when err.type is `system`, err.code contains system error code
        if (systemError) {
            this.code = this.errno = systemError.code;
        }
        // hide custom error implementation details from end-users
        Error.captureStackTrace(this, this.constructor);
    }
}

export const handleError = (e, req, res, next) => {
    if (process.env.NODE_ENV !== 'production') {
        throw e;
    }
    console.error(e);
    res.status(e.statusCode || 500).end(`Error happend: ${e.toString()}`);
};