<script>
    import {createEventDispatcher, onMount} from 'svelte';
    import Dialog, {Title, Content, Actions, InitialFocus} from '@smui/dialog';
    import Button, {Label} from '@smui/button';
    import Avatar from './Avatar.svelte';

    let simpleDialog;
    export let ntkPerson;

    const dispatch=createEventDispatcher();

    onMount(() => {
        simpleDialog.open();
    })


    function closeHandler(e) {
        dispatch('dialogClosed', e);
    }

    function onClicked(e) {

    }

    function onClosing(e) {
        console.log('onClosing', e)
        e.stopPropagation();
    }

</script>

<style type="text/scss">
    .content {

    }

    :global(.mdc-typography--body2), :global(.mdc-typography--caption) {
        font-family: Roboto, sans-serif;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        line-height: 1.25rem;
        font-weight: 400;
        text-decoration: inherit;
        text-transform: inherit;
    }

    :global(.mdc-typography--headline6) {
        font-size: 1.25rem;
        font-weight: 500;
        letter-spacing: .0125em;
    }

    :global(.mdc-typography--subtitle1), :global(.mdc-typography--subtitle2) {
        font-family: Roboto, sans-serif;
        -moz-osx-font-smoothing: grayscale;
        -webkit-font-smoothing: antialiased;
        text-decoration: inherit;
        text-transform: inherit;
    }

    .card-details {
        padding: 0 15px;
    }

    .avatar-container {
        display: flex;
        height: 120px;
        width: 100%;
        justify-content: space-between;
        align-items: center;
        border-bottom: solid 1px #ececec;
        cursor: pointer;

        .person-details {
            width: 200px;

            h3, h5 {
                margin: 0;
            }

            .ntk-name {
                margin-bottom: 10px;
            }

            .ntk-age {
                color: #b3b3b3;
            }
        }

    }

    .ntk-details-rows-container {
        margin-top: 5px;

        .ntk-details-row {
            .caption {
                color: #b3b3b3;
                text-transform: uppercase;
                font-size: 13px;
            }

            .details {
                color: #666666;
                font-size: 14px;
                font-weight: 500;
            }
        }
    }

    :global(.toggle-button) {
        display: none;
    }
    :global(.toggle-button.active){
        display: block;
    }
</style>

<Dialog bind:this={simpleDialog}
        aria-labelledby="simple-title"
        aria-describedby="simple-content"
        on:MDCDialog:closed={closeHandler}
        on:MDCDialog:closing={onClosing}
>
    <div class="card-details">
        <div class="avatar-container">
            <Avatar imageUrl={ntkPerson.ntkDetails.imageUrl}/>
            <div class="person-details">
                <h3 class="ntk-name">
                    {ntkPerson.ntkDetails.name}
                </h3>
                <h5 class="ntk-age">
                    <span>Age:</span>
                    <span>{ntkPerson.ntkDetails.age}</span>
                </h5>
            </div>

        </div>
        <div class="ntk-details-rows-container">
            <div class="ntk-details-row">
                <div class="caption">Hobbies</div>
                <div class="details"> {ntkPerson.ntkDetails.moreDetails.hobbies}</div>
            </div>
        </div>

    </div>
    <Actions>
        <Button on:click={onClicked}>
            <Label>Close</Label>
        </Button>
    </Actions>
</Dialog>

<!--<Button on:click={() => simpleDialog.open()}><Label>Open Dialog</Label></Button>-->
