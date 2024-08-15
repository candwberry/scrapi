<script>
	export let bg = '#eae4df';
	export let head = '#f9f3ed';
	export let svg = '#c4beb8';
	export let border = '#d1d5db';
</script>

<div class='flex flex-col rounded-xl shadow-lg w-full h-full max-h-full' style={`background-color: ${bg}`}>
	<div class='grid grid-cols-2 border-b rounded-t-xl py-2 px-2' style={`background-color: ${head}; border-color: ${border}`}>
		<div class="flex justify-self-start items-center justify-center gap-1 flex-shrink-0">
			<div class="w-3 h-3 bg-[#fe5c54] rounded-full text-xs"></div>
			<div class="w-3 h-3 bg-[#febb2e] rounded-full"></div>
			<div class="w-3 h-3 bg-[#27c840] rounded-full"></div>
			<slot name="file"><button class="ml-4 w-6 h-6 rounded-full"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					height="1.5rem"
					viewBox="0 -960 960 960"
					width="1.5rem"
					fill={svg}><path d="M560-240 320-480l240-240 56 56-184 184 184 184-56 56Z" /></svg
				></button
			>
			<button class="w-6 h-6 rounded-full"
				><svg
					xmlns="http://www.w3.org/2000/svg"
					height="1.5rem"
					viewBox="0 -960 960 960"
					fill={svg}><path d="M504-480 320-664l56-56 240 240-240 240-56-56 184-184Z" /></svg
				></button
			></slot>
		</div>
		<slot name="title"></slot>
	</div>
    <slot></slot>
</div>
