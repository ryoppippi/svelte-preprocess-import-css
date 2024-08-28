export const snapshot = {};

snapshot[`example svelte partial 1`] = `
\`<script>
  let name = 'world';
</script>

<div class="m2">This is a paragraph</div>
<p id="message">This is a paragraph</p>

<style>
  
div {
  color: red;
  background: blue;
}


  
p {
  color: blue;
}

.m2 {
  background: yellow;
}



 #message {
    text-decoration: underline;
  }
</style>
\`
`;
