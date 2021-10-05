import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { IMXOverlayListComponent } from './overlay-list.component';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { OverlayListInputModel, OverlayListResponseModel, LoadMoreItemsModel, ApplyFilterModel } from './overlay-list.model';
import { CdkOverlayOrigin } from '@angular/cdk/overlay';
import { Observable } from 'rxjs';

/**
 * default input list items
 */
const optionItems = [
    { label: 'item 1', value: 'item 1' },
    { label: 'item 2', value: 'item 2' },
    { label: 'item 3', value: 'item 3' },
    { label: 'item 4', value: 'item 4' },
    { label: 'item 5', value: 'item 5' },
    { label: 'option 1', value: 'option 1' },
    { label: 'option 2', value: 'option 2' },
    { label: 'option 3', value: 'option 3' },
    { label: 'option 4', value: 'option 4' },
    { label: 'option 5', value: 'option 5' },
] as OverlayListInputModel[];

const arrayInputTemplate = `
<div>
    <button #CdkOverlayOrigin="cdkOverlayOrigin" cdkOverlayOrigin (click)="$event.stopPropagation();overlayOrigin = CdkOverlayOrigin; isOpen = !isOpen;" > {{isOpen ? "Close " : "Open "}}Overlay</button>
</div>
<imx-overlay-list
    *ngIf="true" 
    (onApply)="onApply($event)"
    (onLoadMoreItems)="onSearchItemsFilter($event)"
    (close)="isOpen=false"
    (open)="isOpen=true" 
    [CdkOverlayOrigin]="overlayOrigin"  
    [isOpen]="isOpen"
    [items]="items"
    [searchLabel]="searchLabel"
    [searchCaseSensitive]="false"
    [searchWithStart]="false">
</imx-overlay-list>`;

const observableInputTemplate = `
<div>
    <button #CdkOverlayOrigin="cdkOverlayOrigin" cdkOverlayOrigin (click)="$event.stopPropagation();overlayOrigin = CdkOverlayOrigin; isOpen = !isOpen;" > {{isOpen ? "Close " : "Open "}}Overlay</button>
</div>
<imx-overlay-list
    *ngIf="true" 
    [CdkOverlayOrigin]="overlayOrigin"
    (close)="isOpen=false"
    (open)="isOpen=true" 
    [isOpen]="isOpen"
    [items]="itemObserver"
    [searchLabel]="searchLabel"
    (onLoadMoreItems)="onSearchItemsFilter($event)"
>
</imx-overlay-list>`

export default {
    title: 'shared/components/overlay-list/overlay-list.component',
    component: IMXOverlayListComponent,
    decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const arrayTemplate: Story<IMXOverlayListComponent> = (args: IMXOverlayListComponent) => ({
    props: args,
    template: arrayInputTemplate,
});

const ObservableTemplate: Story<IMXOverlayListComponent> = (args: IMXOverlayListComponent) => ({
    props: args,
    template: observableInputTemplate
});

/**
 * @argument of array input arguents imx-overlay-list selector
 */
const arrayArgs = {
    overlayOrigin: CdkOverlayOrigin,
    filterItems: [],
    items: optionItems,
    searchLabel: 'Search Items',
    isOpen: false,
    onApply: function (val: ApplyFilterModel) {
        this.filterItems = val?.selectedItem;
    },
    onSearchItemsFilter: function (obj: LoadMoreItemsModel) {
        console.log('onSearchItemsFilter: ', obj);
        const { searchText } = obj;
        this.items = searchText ? optionItems.filter(item => item.label.indexOf(searchText) > -1) : optionItems;
    }
}


/**
 *  @argument of an Observable input arguents for imx-overlay-list selector
 */
const observableArgs = {
    overlayOrigin: CdkOverlayOrigin,
    filterItems: [],
    itemObserver: new Observable(observer => {
        setTimeout(() => {
            const observableInputData = { result: optionItems, pagination: { perPage: 10, total: 5, page: 1 } } as OverlayListResponseModel;
            observer.next(observableInputData);
        }, 1000)
    }) as Observable<OverlayListResponseModel>,
    isOpen: false,
    onApply: function (val: ApplyFilterModel) {
        this.filterItems = val?.selectedItem;
    },
    getObservableData: function (val: string) {
        return new Observable(observer => {
            setTimeout(() => {
                const observableInputData = { result: (val) ? optionItems.filter(item => item.label.indexOf(val) > -1) : optionItems, pagination: { perPage: 10, total: 5, page: 1 } } as OverlayListResponseModel;
                observer.next(observableInputData);
            }, 1000)
        }) as Observable<OverlayListResponseModel>;
    },
    onSearchItemsFilter: function (obj: LoadMoreItemsModel) {
        console.log('obj: ', obj);
        this.itemObserver = this.getObservableData(obj.searchText);
    }

}
export const arrayInputOverlay = arrayTemplate.bind({});
arrayInputOverlay.args = arrayArgs;

export const observableInputOverlay = ObservableTemplate.bind({});
observableInputOverlay.args = observableArgs;