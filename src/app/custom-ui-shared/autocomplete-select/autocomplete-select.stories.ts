import { FormGroup, FormControl } from '@angular/forms';
import { Component, Input } from '@angular/core';
import { moduleMetadata, storiesOf } from '@storybook/angular';
import { AutocompleteSelectComponent } from 'app/custom-ui-shared/autocomplete-select';
import { Options } from 'app/custom-ui-shared/autocomplete-select/types';
import { StoriesModuleTesting } from 'stories/stories.module.testing';

@Component({
  selector: 'app-autocomplete-story',
  template: `
    <form [formGroup]="form">
      <app-autocomplete-select
        [options]="options"
        label="Autocomplete"
        formControlName="autoComplete"
        [isLoading]="isLoading"
      ></app-autocomplete-select>
    </form>
  `
})
class AutocompleteStoryComponent {
  @Input() public isLoading = false;

  public form = new FormGroup({
    autoComplete: new FormControl(undefined)
  });

  public options: Options = [
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
}

storiesOf('custom-ui-shared/autocomplete-select', module)
  .addDecorator(
    moduleMetadata({
      ...StoriesModuleTesting,
      declarations: [AutocompleteSelectComponent, AutocompleteStoryComponent]
    })
  )
  .add('Inital State', () => ({
    template: `<app-autocomplete-story></app-autocomplete-story>`
  }))
  .add('With loading', () => {
    const props = {
      isLoading: true
    };
    return {
      template: `<app-autocomplete-story [isLoading]="isLoading"></app-autocomplete-story>`,
      props
    };
  });
