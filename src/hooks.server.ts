import ebay from "$lib/ebay";
import { exec } from "child_process";
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  return resolve(event);
};

let currentProcess = null;
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

            if (currentProcess) {
                currentProcess.kill();
            }
    
            currentProcess = exec(data.data, { shell: true });
    
            currentProcess.stdout.on('data', (data) => {
                var processedOutput = data;
                ws.send(processedOutput);
                console.log(processedOutput);
            });
    
            currentProcess.stderr.on('data', (data) => {
                var processedOutput = (data);
                ws.send(processedOutput);
                console.log(processedOutput);
            });
    
            currentProcess.on('close', (code) => {
                console.log(`Child process exited with code ${code}`);
                currentProcess = null;
            });
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
	upgrade(request, upgrade) {
		const url = new URL(request.url);
		if (url.pathname.startsWith("/ws")) {
			return upgrade(request);
		}
	},
};