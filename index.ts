// index.ts
import {
    build_options,
    env,
    handler_default
} from "./build/handler.js";
import "./build/mime.conf.js";

const { serve } = globalThis.Bun;
/*! MIT © Volodymyr Palamar https://github.com/gornostay25/svelte-adapter-bun */
const hostname = env("HOST", "0.0.0.0");
const port = parseInt(env("PORT", 80));
const { httpserver, websocket } = handler_default(build_options.assets ?? true);

const serverOptions = {
    baseURI: env("ORIGIN", undefined),
    fetch: httpserver,
    hostname,
    port,
    development: env("SERVERDEV", build_options.development ?? false),
    error(error) {
        console.error(error);
        return new Response("Uh oh!!", { status: 500 });
    }
};

// @ts-expect-error - websocket is optional but this works :)
websocket && (serverOptions.websocket = websocket);

console.info(`Listening on ${hostname + ":" + port}` + (websocket ? " (Websocket)" : ""));
serve(serverOptions);