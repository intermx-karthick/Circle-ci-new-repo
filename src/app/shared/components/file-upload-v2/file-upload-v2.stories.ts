import { moduleMetadata } from '@storybook/angular';
import { Story, Meta } from '@storybook/angular/types-6-0';
import { StoriesModuleTesting } from 'stories/stories.module.testing';
import { FileUploadV2Component } from './file-upload-v2.component';

export default {
  title: 'shared/file-upload-V2',
  component: FileUploadV2Component,
  decorators: [moduleMetadata(StoriesModuleTesting)]
} as Meta;

const Template: Story<FileUploadV2Component> = (
  args: FileUploadV2Component
) => ({
  component: FileUploadV2Component,
  props: args
});

export const InitialState = Template.bind({});
InitialState.args = {
  fileUploadConfig: {
    acceptMulitpleFiles: true
  }
};
