import { Meta, Story } from '@storybook/angular/types-6-0';
import { moduleMetadata } from '@storybook/angular';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { PhoneNumberInputComponent } from './phone-number-input.component';

export default {
  title: 'custom-ui-shared/phone-number-input',
  component: PhoneNumberInputComponent,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<PhoneNumberInputComponent> = (
  args: PhoneNumberInputComponent
) => ({
  component: PhoneNumberInputComponent,
  props: args
});

export const PhoneNumberInput = Template.bind({});
PhoneNumberInput.args = {
  inputPlaceholder: 'Phone Number'
};
