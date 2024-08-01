<script>
  let name = 'world';
</script>

<div class="m2">This is a paragraph</div>
<p id="message">This is a paragraph</p>

<style>
  @import './main.css#div' scoped;
  @import './partial.css?p&.m2' scoped;

 #message {
    text-decoration: underline;
  }
</style>
