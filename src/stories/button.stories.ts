import { storiesOf, moduleMetadata } from '@storybook/angular';
import { StoriesModuleTesting } from './stories.module.testing';

storiesOf('Widgetworld/button', module)
  .addDecorator(moduleMetadata(StoriesModuleTesting))
  .add('Primary Button', () => {
    const props = {
      label: 'Primary Button',
      buttonClass: 'button-primary'
    };
    return {
      template: `
      <button
        mat-button
        [disabled]="disabled"
        [ngClass]="buttonClass">
        {{ label }}
      </button>
      `,
      props
    };
  })
  .add('Secondary Button', () => {
    const props = {
      label: 'Secondary Button',
      buttonClass: 'button-secondary'
    };
    return {
      template: `
      <button
        mat-button
        [disabled]="disabled"
        [ngClass]="buttonClass">
        {{ label }}
      </button>
      `,
      props
    };
  })
  .add('Secondary ButtonBordered', () => {
    const props = {
      label: 'Secondary Button Bordered',
      buttonClass: 'button-secondary-bordered'
    };
    return {
      template: `
      <button
        mat-button
        [disabled]="disabled"
        [ngClass]="buttonClass">
        {{ label }}
      </button>
      `,
      props
    };
  })
  .add('Tertiary Button', () => {
    const props = {
      label: 'Tertiary Button',
      buttonClass: 'button-tertiary'
    };
    return {
      template: `
      <button
        mat-button
        [disabled]="disabled"
        [ngClass]="buttonClass">
        {{ label }}
      </button>
      `,
      props
    };
  })
  .add('Disabled Primary Button', () => {
    const props = {
      label: 'Disabled Primary Button',
      buttonClass: 'button-primary',
      disabled: true
    };
    return {
      template: `
      <button
        mat-button
        [disabled]="disabled"
        [ngClass]="buttonClass">
        {{ label }}
      </button>
      `,
      props
    };
  });
