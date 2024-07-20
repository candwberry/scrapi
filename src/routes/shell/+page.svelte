<script>
  let commandInput = "";
  /**
     * @type {any[]}
     */
  let commandHistory = [];

  async function sendCommand() {
    if (commandInput.trim() !== "") {
      commandHistory.push("$ " + commandInput);
      const response = await fetch("/shell", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ command: commandInput }),
      });
      console.log(response);
      const data = await response.json();
      console.log("client");
      console.log(data);
      commandHistory.push(data.response);
      console.log(commandHistory);
      commandInput = "";
      commandHistory = [...commandHistory];
    }
  }
</script>


<div id="terminal">
  <div id="header">
      <div id="circlerow">
          <div
          class="circle red text-white"
          role="button"
          tabindex="0"
          on:keydown={(e) => e.key === "Enter"}
           >X</div>
          <div class="circle yellow"></div>
          <div class="circle green"></div>    
      </div>
  </div>
  <div id="messages" style="scroll-behavior: smooth;">
      {#each commandHistory as item}
        <div class="text-white font-mono mb-2">{item}</div>
      {/each}
      <div id="input" 
          class="text-white font-mono"
          on:keydown={(e) => e.key === "Enter" && e.shiftKey === false && sendCommand()}
          role="textbox"
          aria-multiline="true"
          tabindex="0"
      >
      <textarea
        id="command"
        class="text-white font-mono"
        bind:value={commandInput}
        placeholder="$"
        rows="1"
      ></textarea>
      </div>    
  </div>
</div>
<div class="message"><div></div></div>

<style>

#circlerow {
  display: flex;
  align-items: center;
}

.circle {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
  margin: 0 0.1rem;
}

#header {
  padding: 0.5rem;
  background-color: #faf5f4;
  border-top-left-radius: 1em;
  border-top-right-radius: 1em;
  border-bottom: 2px solid white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

#apikey {
  border: none;
  outline: none;
  background-color: transparent;
  font-family: "Courier New", Courier, monospace;
  font-size: 1rem;
  width: 100%;
  max-width: 6rem;
}

.red {
  background-color: #ff5f56;
  font-size: 10px;
  font-weight: bold;
  cursor: pointer;
  align-items: center;
  display: flex;
  justify-content: center;
}

.yellow {
  background-color: #ffbd2e;
}

.green {
  background-color: #27c93f;
}

#messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  background-color: white;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;

}

#terminal {
  display: flex;
  flex-direction: column;
  width: calc(100% - 4rem);
  height: calc(100% - 4rem);
  align-self: center;
  border-radius: 1rem;
  box-shadow: 0 0 1rem rgba(0, 0, 0, 0.3);
}

#messages {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
  background-color: #242424;
  font-family: "Courier New", Courier, monospace;
  border-bottom-left-radius: 1rem;
  border-bottom-right-radius: 1rem;
}

#input {
  display: flex;
  align-items: center;
  color: white;
}

#input textarea {
  flex: 1;
  background-color: transparent;
  color: white;
  font-family: "Courier New", Courier, monospace;
  border: none;
  outline: none;
  resize: auto;
  padding-left: 1.25rem;
  height: 10rem;
}

#input textarea::placeholder {
  color: rgba(255, 255, 255, 0.808);
  /* offset it to the right by 1 rem */
  transform: translateX(-1rem);
}

#input textarea:focus {
  outline: none;
}

.message {
  color: white;
}

.message > * {
  color: inherit;
  color: white;
}
</style>