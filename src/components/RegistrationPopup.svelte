<script>
    import {createEventDispatcher, onMount} from 'svelte';
    import TextBox from '../common/TextBox.svelte';
    import Dialog, {Title, Content, Actions, InitialFocus} from '@smui/dialog';
    import Button, {Label} from '@smui/button';
    import Avatar from '../common/Avatar.svelte';

    let simpleDialog;
    let name;
    let email;
    let hobbies;
    let age;
    let aboutMe;

    const dispatch=createEventDispatcher();

    onMount(() => {
        simpleDialog.open();
    })

    function closeHandler(e) {
        // dispatch('popupClosed', {
        //     value : {
        //         name,
        //         age,
        //         email,
        //         moreDetails : {
        //             hobbies,
        //             aboutMe
        //         }
        //     }
        // });
    }

    function submit(e) {
        dispatch('submit', {
            value : {
                name,
                age,
                email,
                moreDetails : {
                    hobbies,
                    aboutMe
                }
            }
        });
    }

    function onClosing(e) {
        console.log('onClosing', e)
        e.stopPropagation();
    }

</script>

<style type="text/scss">
    .header {
        height: 50px;
        background-color: #efefef;
        font-size: 20px;
        text-transform: uppercase;
        font-weight: 500;
        color: gray;
        padding-left: 10px;
        line-height: 45px;
    }

    .form-details {

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

    :global(.actions) {
        margin-top:10px;
    }

    :global(.about-me) {
        margin-top:20px;
    }


    .card-details {
        width: 400px;
        padding: 0 15px;
        overflow: auto;
    }

    .avatar-container {
        display: flex;
        height: 120px;
        width: 100%;
        justify-content: space-evenly;
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
</style>

<Dialog bind:this={simpleDialog}
        aria-labelledby="simple-title"
        aria-describedby="simple-content"
        on:MDCDialog:closed={closeHandler}
        on:MDCDialog:closing={onClosing}
>
    <header class="header">register</header>
    <div class="card-details">
        <div class="avatar-container">
            <Avatar/>
            <div class="name-tb">
                <TextBox
                        bind:value={name}
                        label="Name"
                        minWidth="{250}"
                        errorMessage="This field is required"
                />
            </div>
        </div>
        <div class="form-details">
            <TextBox
                    type="number"
                    bind:value={age}
                    label="Age"
                    minWidth="{150}"
                    errorMessage="Please enter a number for your age"
            />
            <TextBox
                    type="email"
                    bind:value={email}
                    label="Email"
                    minWidth="{350}"
                    errorMessage="Please enter a valid email address"
            />
            <TextBox class="about-me" isTextArea="{true}" bind:value={aboutMe} label="About Me"/>
            <TextBox bind:value={hobbies} label="Hobbies (seperated with commas)" minWidth="{350}"/>
        </div>
    </div>
    <Actions class="actions">
        <Button variant="raised" on:click={submit}>
            <Label>Submit</Label>
        </Button>
    </Actions>
</Dialog>
