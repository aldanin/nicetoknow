// @ts-ignore
import GeneralNTKs from '../../components/GeneralNTKs.svelte';
// @ts-ignore
import MyNTKs from '../../components/MyNTKs.svelte';
// @ts-ignore
import NTKsApproval from '../../components/NTKsApproval.svelte';
// @ts-ignore
import viewKeys from "./viewKeys";

export type ViewObject = {
    id: string,
    view: any,
    caption: string,
};

const viewsRepo: ViewObject[] = [
    {
        id: viewKeys.GENERAL_NTKS,
        view: GeneralNTKs,
        caption: 'All Nice-to-knows',
    },
    {
        id: viewKeys.MY_NTKS,
        view: MyNTKs,
        caption: 'My Nice-to-knows',
    },
    {
        id: viewKeys.NTKS_APPROVAL,
        view: NTKsApproval,
        caption: 'Nice-to-knows approval',
    },
];

export  function getView(viewId = viewKeys.MY_NTKS): ViewObject {
    // @ts-ignore
    const found: ViewObject = viewsRepo.find(view => view.id === viewId);

    return found;
}

