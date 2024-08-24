let currentBunProcess = null;
const port = 8081;
const envFilePath = '.env';

async function startBunProcess() {    
    // Start a new bun process
    currentBunProcess = Bun.spawn(["bun", "--bun", "."], {
        onExit(proc, exitCode, signalCode, error) {
            console.error(`Bun process exited with code ${exitCode}.`);

            console.log("Restarting Bun process...");
            startBunProcess();
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
        try { if (currentBunProcess) currentBunProcess.kill(); else { startBunProcess(); } } catch (error) { console.log(error) };
        
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
startServer(); // Start the HTTP server testtest
