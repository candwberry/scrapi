import type { RequestHandler } from "@sveltejs/kit";

// @ts-expect-error - Only exists at runtime, if we force bun --bun
const proc = Bun.spawn(["bash"], {
    stdin: "pipe",
    stdout: "pipe",
    stderr: "pipe"
});

const reader = proc.stdout.getReader();
const stderrReader = proc.stderr.getReader();

async function readOutput(reader: ReadableStreamDefaultReader<Uint8Array>): Promise<string> {
    let output = '';
    const { done, value } = await Promise.race([reader.read(), new Promise((resolve) => setTimeout(() => resolve({ done: true, value: new Uint8Array() }), 500))]);
    output += new TextDecoder().decode(value);
    console.log(output);
    console.log(done);
    return output.trim();
}

async function callCommand(command: string): Promise<string> {
    const enc = new TextEncoder();
    await proc.stdin.write(enc.encode(command + "\n"));
    await proc.stdin.flush();
    
    const output = await readOutput(reader);
    
    return output;
}

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    console.log("Body:", body);

    const message = body.command;
    console.log("Message:", message);

    const response = await callCommand(message);
    console.log("ResponseSERVER:", response);

    return new Response(JSON.stringify({ response }), {
        headers: {
            "content-type": "application/json"
        }
    });
}