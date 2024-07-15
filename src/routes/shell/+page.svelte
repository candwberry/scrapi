<script>
  import { onMount } from 'svelte';

  let terminalOutput = '';

  const socket = new WebSocket('ws://localhost:8080/ws');

  socket.onmessage = (event) => {
    terminalOutput += event.data;
  };

  function sendCommand(command) {
    socket.send(JSON.stringify(command));
  }

  onMount(() => {
    // Connect to the WebSocket server
    socket.onopen = () => {
      console.log('Connected to WebSocket server');
    };

    // Handle WebSocket errors
    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Handle WebSocket close event
    socket.onclose = () => {
      console.log('WebSocket connection closed');
    };
  });
</script>

<textarea bind:value={terminalOutput} readonly></textarea>
<input type="text" on:keydown={(event) => event.key === 'Enter' && sendCommand({ "type": "shell", "data": (event.target.value) })} />

<style>
  textarea {
    width: 100%;
    height: 300px;
    border: 4px solid #f9f9f9;
  }

  input {
    width: 100%;
    height: 30px;
    border: 4px solid #f9f9f9;
  }
</style>