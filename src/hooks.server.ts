import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};

/** @type {import("svelte-adapter-bun").WebSocketHandler} */
export const handleWebsocket = {
	open(_ws: any) {
		console.log("WebSocket opened");
	},

	async message(ws: { send: (arg0: string) => void; }, message: string) {
		console.log("WebSocket message:", message);
		if (typeof message === "string") {
			const data = JSON.parse(message);
			if (data.type !== undefined && data.data !== undefined)
				switch (data.type) {
					case 'ebay':
						ws.send(JSON.stringify({ type: 'ebay', data: JSON.stringify(resp) }));
						break;

			} else {
            console.error("WebSocket message is not as expected.");
        }
		} else {
			console.error("WebSocket message is not JSON.");
		}

	},

	/**
	 * @param {Request} request
	 * @param {Function} upgrade
	 */
	upgrade(request: { url: string | URL; }, upgrade: (arg0: any) => any) {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/ws")) {
			return upgrade(request);
		}
	},
};