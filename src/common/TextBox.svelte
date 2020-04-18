<script>
    import Textfield, {Input, Textarea} from '@smui/textfield';
    import HelperText from '@smui/textfield/helper-text/index';

    export let errorMessage='';
    export let label = '';
    export let minWidth;
    export let type;

    export let value='';
    export let dirty=false;
    export let invalid=false;
    let invalidClickable=false;


</script>

<style>

</style>

<Textfield type="{type}"
           withTrailingIcon={value !== ''}
           bind:dirty={dirty}
           bind:invalid={invalid}
           updateInvalid
           bind:value={value}
           label="{label}"
           style="min-width: {minWidth ? `${minWidth}px`: '250px'}"

>
</Textfield>
<HelperText validationMsg>{errorMessage}</HelperText>

<!--           input$autocomplete="email"-->
