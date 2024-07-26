<script>
  let commandInput = "";
  let commandHistory = [
    "Welcome! This terminal runs commands on the Raspberry Pi.",
    "e.g. echo 'Hello, World!', would output 'Hello, World!'",
  ];

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
      const data = await response.json();
      commandHistory.push(data.response);
      commandInput = "";
      commandHistory = [...commandHistory];
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      const messagesDiv = document.getElementById("messages");
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 0);
  }
</script>

<div class="w-full h-full flex justify-center">
  <div id="terminal">
    <div id="header">
      <div id="circlerow">
        <div class="circle red" role="button" tabindex="0"></div>
        <div class="circle yellow"></div>
        <div class="circle green"></div>    
      </div>
    </div>
    <div id="messages">
      {#each commandHistory as item}
      <pre class="text-white font-mono mb-2 whitespace-pre-wrap">{item}</pre>
      {/each}
      <div id="input" 
        class="text-white font-mono"
        on:keydown={(e) => e.key === "Enter" && e.shiftKey === false && sendCommand()}
        role="textbox"
        aria-multiline="true"
        tabindex="0"
      >
        <div class="textarea-wrapper w-full h-[250px] flex flex-col">
          <textarea
            id="command"
            class="text-white font-mono w-full h-[250px]"
            bind:value={commandInput}
            placeholder=""
            rows="1"
          ></textarea>
        </div>
      </div>    
    </div>
  </div>
</div>

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

  #terminal {
    display: flex;
    flex-direction: column;
    width: calc(100%);
    height: calc(100%);
    align-self: center;
    border-radius: 1rem;
    box-shadow: 0 0 1rem rgba(0, 0, 0, 0.3);
  }

  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    background-color: #242424;
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
    border: none;
    outline: none;
    resize: auto;
    padding-left: 1.1rem;
    height: 10rem;
    padding-bottom: 2rem;
  }

  .textarea-wrapper {
    position: relative;
  }

  .textarea-wrapper::before {
    content: "$";
    position: absolute;
    color: rgba(255, 255, 255, 0.808);
    pointer-events: none;
  }

  #input textarea:focus {
    outline: none;
  }
</style>