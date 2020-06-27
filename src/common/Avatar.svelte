<script>
  import { createEventDispatcher } from "svelte";

const dispatch = createEventDispatcher();
  export let imageUrl = "./media/download.png";
  export let height = "100%";
  $: console.log("avatar", imageUrl);



  function onClick() {
      dispatch('click', null);
  }
</script>

<style type="text/scss">
  .avatar {
    display: flex;
    justify-content: center;
    height: 100%;

    img {
      object-fit: cover;
      height: 100%;
      border-radius: 50%;
    }
  }
</style>

<div class="avatar" style="height:{height};" on:click={onClick}>
  <img src={imageUrl} />
</div>
