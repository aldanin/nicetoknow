<script>
    export let imageUrl = './media/download.png';
    $: console.log('avatar', imageUrl)
</script>

<style type="text/scss">
.avatar {
    display: flex;
    justify-content: center;

    img {
        object-fit: cover;
        height: 100px;
        width: 100px;
        border-radius: 50%;
    }
}
</style>

<div class="avatar">
    <img src={imageUrl}>
</div>
