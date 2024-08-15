<script lang='ts'>
  import Window from '$lib/components/Window.svelte';
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
      if (messagesDiv) messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }, 0);
  }
</script>

<Window head="#3b3b39" border="#000">
  <h1 slot="title" class="font-bold text-white">Shell</h1>
  <div id="messages">
    {#each commandHistory as item}
      <pre class="text-white font-mono mb-2 whitespace-pre-wrap">{item}</pre>
    {/each}
    <div
      id="input"
      class="text-white font-mono"
      on:keydown={(e) =>
        e.key === "Enter" && e.shiftKey === false && sendCommand()}
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
</Window>

<style>
  #messages {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
    background-color: #222;
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
