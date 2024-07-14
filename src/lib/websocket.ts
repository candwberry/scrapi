import { browser } from '$app/environment';
let ws: WebSocket | null = null;

if (browser) {
    const protocol = window.location.protocol === 'http:' ? 'ws:' : 'wss:';
    const host = window.location.host;
    ws = new WebSocket(`${protocol}//${host}/ws`);
}


export { ws };