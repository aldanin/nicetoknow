<script>
    import IconButton, {Icon} from '@smui/icon-button';

    function onMyNtksClicked() {
        alert('fav');
    }

    function onShowMoreClicked() {
        alert('show more')
    }
</script>

<style type="text/scss">
    .container {
        max-width: 100%;
        width: unset;
        height: 60px;
        box-shadow: 0 4px 2px -2px grey;
        background-color: #a70000;
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 0 30px;

        .logo {
            font-family: fantasy;
            font-style: italic;
            fonty-weight: bold;
            color: #e8e8ff;
            font-weight: 500;
            font-size: 25px;
        }

        .controls {
            color: white;
        }
    }
</style>

<header class="container">
    <div class="logo">
        <span class="logo-inner">Nice to know</span>
    </div>
    <div class="controls">
        <IconButton class="material-icons"
                    on:click={onMyNtksClicked}
                    title="My Nice-to-know's">favorite_border
        </IconButton>
        <IconButton class="material-icons"
                    on:click={onShowMoreClicked}
                    title="Show more">face
        </IconButton>
    </div>
</header>
