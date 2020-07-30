<script>
  import Desktop from "./AppDesktop.svelte";
  import SystemMessage from "./sysMessageService/SystemMessage.svelte";

  let visible = false;
</script>

<style type="text/scss">
  .sys-msg-wrap {
    position: absolute;
    left: 80px;
    bottom: 30px;
  }
</style>

<main class="container">
  <Desktop />
  <div class="sys-msg-wrap">
    <SystemMessage />
  </div>
</main>
