import type { RequestHandler } from "@sveltejs/kit";

let currentWorkingDirectory = process.cwd();
Bun.$.cwd(currentWorkingDirectory);
console.log(currentWorkingDirectory);

async function executeCommand(command: string): Promise<{ stdout: string; stderr: string }> {
    if (command.trim().startsWith('cd')) {
        // Handle cd command separately
        const newDir = command.trim().substring(3);
        // if == ".." then go to parent dir
        currentWorkingDirectory = currentWorkingDirectory.replaceAll("/", "\\").substring(0, currentWorkingDirectory.lastIndexOf("\\"));
        console.log(currentWorkingDirectory);
        console.log("HELLO");
        Bun.$.cwd(currentWorkingDirectory);
        const result = await Bun.$`pwd`;
        
        return {
            stdout: result.stdout.toString(),
            stderr: ''
        };
        
        try {
            Bun.$`pwd`.cwd(newDir);
            return { stdout: '', stderr: '' };
        } catch (error) {
            return { stdout: '', stderr: `cd: ${error.message}` };
        }
    } else {
        try {
            const result = await Bun.$`${command.split(" ")}`;
            return { 
                stdout: result.stdout.toString(),
                stderr: result.stderr.toString()
            };
        } catch (error) {
            return { 
                stdout: error.stdout?.toString() || '',
                stderr: error.stderr?.toString() || error.message 
            };
        }
    }
}

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json();
    console.log("Body:", body);

    const message = body.command;
    console.log("Message:", message);

    let out = undefined
    let err = undefined;
    try {
        const { stdout, stderr } = await executeCommand(message);
        out = stdout;
        err = stderr;
    } catch (error) {
        console.log("Error:", error);
        err = error.message;
    } finally {
        console.log("Finally:", out, err);
    };
    
    console.log("ResponseSERVER stdout:", out);
    console.log("ResponseSERVER stderr:", err);
    let response = out + err;

    if (out === undefined || err === undefined) {
        // possible out of bounds wd so we will reset session
        currentWorkingDirectory = process.cwd();
        Bun.$.cwd(currentWorkingDirectory);
        console.log("Resetting session");
        response = "Operation not permitted, session reset.";
    }
    return new Response(JSON.stringify({ response }), {
        headers: {
            "content-type": "application/json"
        }
    });
}