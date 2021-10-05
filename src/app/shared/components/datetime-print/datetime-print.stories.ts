import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { DatetimePrintComponent } from './datetime-print.component';

export default {
  title: 'shared/components/datetime-print',
  component: DatetimePrintComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<DatetimePrintComponent> = (
  args: DatetimePrintComponent
) => ({
  component: DatetimePrintComponent,
  props: args
});

export const DatetimePrintView = Template.bind({});
DatetimePrintView.args = {
  today: new Date()
};
