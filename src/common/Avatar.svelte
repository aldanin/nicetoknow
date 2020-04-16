<script>
    export const imageUrl = "https://encrypted-tbn0.gstatic" +
            ".com/images?q=tbn%3AANd9GcSapNUPagpDkSy9fopZTUcxOzxWoFMDHXMvRe2Ke3IoUEJMkXIQ&usqp=CAU"
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
