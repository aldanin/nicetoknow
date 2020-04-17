// @ts-ignore
import MoreNTKs from '../../components/MoreNTKs.svelte';
// @ts-ignore
import MyNTKs from '../../components/MyNTKs.svelte';

export type ViewObject = {
    id: string,
    view: any,
    caption: string,
};

const viewsRepo: ViewObject[] = [
    {
        id: 'moreNtks',
        view: MoreNTKs,
        caption: 'More Nice-to-knows',
    },
    {
        id: 'myNtks',
        view: MyNTKs,
        caption: 'My Nice-to-knows',
    },
];

export  function getView(viewId = 'myNtks'): ViewObject {
    // @ts-ignore
    const found: ViewObject = viewsRepo.find(view => view.id === viewId);

    return found;
}

