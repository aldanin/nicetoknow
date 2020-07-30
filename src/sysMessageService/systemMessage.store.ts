import { writable, Writable } from "svelte/store";

const sysMsgStore: Writable<SysMessage> = writable<SysMessage>({
    text: '',
    isError: false,
    isOpen: false
})

const SysMessageService = {
    subscribe: sysMsgStore.subscribe,
    showMessage: (text, isError = false) => {
        sysMsgStore.update(store => {
           return {text, isError, isOpen: true};
        })
    },
    closeMessage: () => {
        sysMsgStore.update(store => {
           return  { text: '',
           isError: false,
           isOpen: false};
        })
    },
}

export type SysMessage = {
    text: string,
    isError: boolean,
    isOpen?: boolean
}

export default SysMessageService;