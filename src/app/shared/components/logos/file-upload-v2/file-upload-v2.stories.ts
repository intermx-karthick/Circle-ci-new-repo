import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { LogoFileUploadV2Component } from './file-upload-v2.component';

export default {
  title: 'records-management-v2/logos/file-upload-V2',
  component: LogoFileUploadV2Component,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<LogoFileUploadV2Component> = (
  args: LogoFileUploadV2Component
) => ({
  component: LogoFileUploadV2Component,
  props: args
});

export const InitialState = Template.bind({});
InitialState.args = {
  fileUploadConfig: {
    acceptMulitpleFiles: true
  }
};
