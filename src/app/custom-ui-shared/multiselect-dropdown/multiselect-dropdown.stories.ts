import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { MultiselectDropdownComponent } from './multiselect-dropdown.component';
import { Options } from './types';

export default {
  title: 'custom-ui-shared/multiselect-dropdown',
  component: MultiselectDropdownComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<MultiselectDropdownComponent> = (
  args: MultiselectDropdownComponent
) => ({
  component: MultiselectDropdownComponent,
  props: args
});

const options: Options = [
  { id: '1', name: 'Name 1' },
  { id: '2', name: 'Name 2' },
  { id: '3', name: 'Name 3' },
  { id: '4', name: 'Name 4' },
  { id: '5', name: 'Name 5' },
  { id: '6', name: 'Name 6' },
  { id: '7', name: 'Name 7' },
  { id: '8', name: 'Name 8' },
  { id: '9', name: 'Name 9' },
  { id: '10', name: 'Name 10' },
  { id: '11', name: 'Name 11' },
  { id: '12', name: 'Loooooooooooooong Name 12' }
];

export const InitialState = Template.bind({});
InitialState.args = {
  options,
  label: 'Multiselect Dropdown',
  tooltip: 'Tooltip'
};
