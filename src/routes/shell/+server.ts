import type { RequestHandler } from "@sveltejs/kit";

let currentWorkingDirectory = process.cwd();
Bun.$.cwd(currentWorkingDirectory);

async function executeCommand(
  command: string,
): Promise<{ stdout: string; stderr: string }> {
  if (command.trim().startsWith("cd")) {
    currentWorkingDirectory = currentWorkingDirectory
      .replaceAll("/", "/")
      .substring(0, currentWorkingDirectory.lastIndexOf("/"));

    Bun.$.cwd(currentWorkingDirectory);
    const result = await Bun.$`pwd`;

    return {
      stdout: result.stdout.toString(),
      stderr: "",
    };
  } else {
    try {
      const result = await Bun.$`${command.split(" ")}`;
      return {
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
      };
    } catch (error) {
      return {
        stdout: error?.toString() || "",
        stderr:
          error?.toString() || (error as Error).message
            ? (error as Error).message
            : "",
      };
    }
  }
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await request.json();

  const message = body.command;

  let out = undefined;
  let err = undefined;
  try {
    const { stdout, stderr } = await executeCommand(message);
    out = stdout;
    err = stderr;
  } catch (error) {
    err = (error as Error).message ? (error as Error).message : error;
  } finally {
  }

  let response = (out ? out : "") + (err ? err : "");

  if (out === undefined || err === undefined) {
    // Possible out of bounds Working Directory so we will reset session
    currentWorkingDirectory = process.cwd();
    Bun.$.cwd(currentWorkingDirectory);

    response = "Operation not permitted, session reset.";
  }

  return new Response(JSON.stringify({ response }), {
    headers: {
      "content-type": "application/json",
    },
  });
};
