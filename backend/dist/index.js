import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { initPostgres } from "./db/postgres.js";
process.on("unhandledRejection", (reason) => {
    // eslint-disable-next-line no-console
    console.error("UnhandledPromiseRejection:", reason);
});
process.on("uncaughtException", (err) => {
    // eslint-disable-next-line no-console
    console.error("uncaughtException:", err);
});
async function main() {
    await initPostgres();
    const app = createApp();
    app.listen(env.PORT, () => {
        // eslint-disable-next-line no-console
        console.log(`RiseUp backend listening on :${env.PORT} (${env.NODE_ENV})`);
    });
}
main().catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
});
