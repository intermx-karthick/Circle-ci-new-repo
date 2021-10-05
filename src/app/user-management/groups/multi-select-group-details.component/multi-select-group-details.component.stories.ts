import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { of } from 'rxjs';
import { Observable } from 'rxjs';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { MultiSelectGroupDetailsComponent } from './multi-select-group-details.component';

export default {
  title: 'user-management/groups/multi-select-group-details',
  component: MultiSelectGroupDetailsComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<MultiSelectGroupDetailsComponent> = (
  args: MultiSelectGroupDetailsComponent
) => ({
  component: MultiSelectGroupDetailsComponent,
  props: args
});

const selectedElements: any[] = [
  {
    _id: 0,
    description: 'A user that is able to control all insights suite',
    name: 'Site Admin'
  },
  {
    _id: 1,
    description: 'A user that is able to control all insights suite',
    name: 'Site Manager'
  }
];

const filteredElements: Observable<any> = of([
  {
    _id: 2,
    description: 'A user that is able to control all insights suite',
    name: 'Inventory Manager'
  },
  {
    _id: 3,
    description: 'A user that is able to control all insights suite',
    name: 'Site User'
  }
]);

export const AutocompleteWithSelectedOptions = Template.bind({});
AutocompleteWithSelectedOptions.args = {
  label: 'Roles',
  selectedElements,
  filteredElements
};
