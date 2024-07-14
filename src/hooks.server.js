import ebay from "$lib/ebay";

/** @type {import("svelte-adapter-bun").WebSocketHandler} */
export const handleWebsocket = {
	open(ws) {
		console.log("WebSocket opened");
	},

	async message(ws, message) {
		console.log("WebSocket message:", message);
		if (typeof message === "string") {
			const data = JSON.parse(message);
			if (data.type !== undefined && data.data !== undefined)
				switch (data.type) {
					case 'ebay':
						const resp =  await ebay(data.data);
						ws.send(JSON.stringify({ type: 'ebay', data: JSON.stringify(resp) }));
						break;
				}
            else {
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
	upgrade(request, upgrade) {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/ws")) {
			return upgrade(request);
		}
	},
};