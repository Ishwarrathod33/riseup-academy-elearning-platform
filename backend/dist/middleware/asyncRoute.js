/**
 * Wraps an async Express handler so rejections become 500 JSON responses
 * instead of UnhandledPromiseRejection.
 */
export function asyncRoute(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch((error) => {
            // eslint-disable-next-line no-console
            console.error(error);
            if (res.headersSent) {
                next(error);
                return;
            }
            res.status(500).json({ message: "Server error" });
        });
    };
}
