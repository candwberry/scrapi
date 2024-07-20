import {GlobalKeyboardListener} from "node-global-key-listener";
import { appendFile } from "node:fs/promises";
let listen = false;
new GlobalKeyboardListener().addListener(function (e, down) { 
    if (e.name == "F8") {
        listen = true;
        console.log(`Listening: ${listen}`);
    } else if (e.name == "F9") {
        listen = false;
        console.log(`Listening: ${listen}`);
    }
    
    if (!listen) return;
        appendFile("test.txt", `${e.name} ${e.state == "DOWN" ? "DOWN" : "UP"}\n`);
}); 