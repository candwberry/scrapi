let currentBunProcess = null;
const port = 8081;

async function startBunProcess(test) {
    if (currentBunProcess && test) {
        currentBunProcess.kill(); // Terminate any existing process
        await currentBunProcess.exited;
    }

    // Start a new bun process
    currentBunProcess = Bun.spawn(["bun", "--bun", "."], {
        onExit(proc, exitCode, signalCode, error) {
            console.error(`Bun process exited with code ${exitCode}. Restarting...`);
            startBunProcess(false); // Restart the process if it exits unexpectedly
        }
    });
}

async function forceGitPull() {
    console.log("Forcing git pull...");
    
    // Reset any local changes and force a git pull
    //await Bun.spawn(["git", "reset", "--hard", "HEAD"]).exited;
    //await Bun.spawn(["git", "clean", "-fd"]).exited;
    await Bun.spawn(["git", "pull", "--force"]).exited;
}

async function runBuildProcess() {
    await forceGitPull(); // Pull the latest changes before building

    // Remove the build directory
    await Bun.spawn(["rm", "-rf", "build"]).exited;

    // Install any package changes
    let installProcess = Bun.spawn(["bun", "install"], {
        onExit(proc, exitCode, signalCode, error) {
            if (exitCode !== 0) console.error("Install process failed :(")
        }
    });
  
    // Run the build process
    let buildProcess = Bun.spawn(["bun", "run", "build"], {
        onExit(proc, exitCode, signalCode, error) {
            if (exitCode === 0) {
                startBunProcess(true); // Start or restart the bun process after a successful build
            } else {
                console.error("Build process failed with exit code", exitCode);
            }
        }
    });

    await buildProcess.exited;
}

async function handleRequest(req, res) {
    console.log("Received build trigger request.");
    res.end("Build triggered.\n");

    await runBuildProcess(); // Trigger the build and restart process
}

async function startServer() {
    console.log(`Listening for requests on http://localhost:${port}`);

    const server = Bun.serve({
        port,
        fetch(req) {
            runBuildProcess();
            // Maybe we could return based on what runBuildProcess returns, so that the GitHub runner knows if some freak accident fails too.
	          return new Response("Received.");
        }
    });

    await server;
}

startServer(); // Start the HTTP server
