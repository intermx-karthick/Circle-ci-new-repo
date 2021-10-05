import {Injectable} from '@angular/core';
import {SpinnerVisibilityService} from 'ng-http-loader';

@Injectable()
export class LoaderService {
  constructor(private spinner: SpinnerVisibilityService) {}

    display(value: boolean) {
      if (value) {
        this.spinner.show();
        return;
      }
      this.spinner.hide();
    }
}
