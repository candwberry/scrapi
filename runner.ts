let currentBunProcess = null;
let isRestarting = false; // Track if we are intentionally restarting
const port = 8081;
const envFilePath = '.env';

async function killOtherBunProcesses() {
    const currentPid = process.pid; // Get the current process ID

    // Use Bun's built-in spawn to get the list of processes
    let psProcess = Bun.spawn(["ps", "-eo", "pid,command"], {
        stdout: 'pipe'
    });

    // Read the output of the ps command
    let output = await new Response(psProcess.stdout).text();
    
    // Filter out non-bun processes and the current process
    let pidsToKill = output
        .split("\n")
        .filter(line => line.includes("bun") && !line.includes(currentPid.toString()))
        .map(line => line.trim().split(" ")[0]) // Get the PID
        .filter(pid => pid);

    // Kill each bun process except the current one
    pidsToKill.forEach(pid => {
        try {
            process.kill(parseInt(pid), "SIGKILL");
            console.log(`Killed bun process with PID: ${pid}`);
        } catch (error) {
            console.error(`Failed to kill process with PID: ${pid}`, error);
        }
    });
}
async function startBunProcess(test) {
    if (currentBunProcess && test) {
        isRestarting = true;
        currentBunProcess.kill(); // Terminate any existing process
        await currentBunProcess.exited;
        await killOtherBunProcesses();
        isRestarting = false;
    }

    // Start a new bun process
    currentBunProcess = Bun.spawn(["bun", "--bun", "."], {
        onExit(proc, exitCode, signalCode, error) {
            console.error(`Bun process exited with code ${exitCode}.`);

            if (!isRestarting) {
                console.log("Restarting Bun process...");
                startBunProcess(false); // Restart the process only if it was unexpected
            }
        }
    });
}

async function runBuildProcess() {
    await forceGitPull(); // Pull the latest changes before building

    // Remove the build directory
    await Bun.spawn(["rm", "-rf", "build"]).exited;

    // Install any package changes
    let installProcess = Bun.spawn(["bun", "install"]);
    await installProcess.exited;

    if (installProcess.exitCode !== 0) {
        console.error("Install process failed :(");
        return false;
    }

    // Run the build process
    let buildProcess = Bun.spawn(["bun", "run", "build"]);
    await buildProcess.exited;

    if (buildProcess.exitCode === 0) {
        startBunProcess(true); // Start or restart the bun process after a successful build
        return true;
    } else {
        console.error("Build process failed with exit code", buildProcess.exitCode);
        return false;
    }
}

async function writeEnvFile(envVars) {
    let envContent = '';
    for (const [key, value] of Object.entries(envVars)) {
        envContent += `${key}=${value}\n`;
    }
    await Bun.write(envFilePath, envContent);
    console.log('.env file has been updated.');
}

async function forceGitPull() {
    console.log("Forcing git pull...");
    
    // Reset any local changes and force a git pull
    //await Bun.spawn(["git", "reset", "--hard", "HEAD"]).exited;
    //await Bun.spawn(["git", "clean", "-fd"]).exited;
    await Bun.spawn(["git", "pull", "--force"]).exited;
}

async function handleRequest(req) {
    console.log("Received build trigger request.");

    const url = new URL(req.url);
    const envVars = Object.fromEntries(url.searchParams);

    if (Object.keys(envVars).length > 0) {
        await writeEnvFile(envVars);
    }

    const buildSuccess = await runBuildProcess(); // Trigger the build and restart process
    
    if (buildSuccess) {
        return new Response("Build succeeded.\n");
    } else {
        return new Response("Build failed.\n", { status: 500 });
    }
}

async function startServer() {
    console.log(`Listening for requests on http://localhost:${port}`);
    const server = Bun.serve({
        port,
        fetch(req) {
            return handleRequest(req);
        }
    });
    await server;
}

await runBuildProcess();
startServer(); // Start the HTTP server
