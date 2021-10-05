import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { CustomLazyLoad } from './custom-lazy-load';

/**
 * @description
 *  To trigger the initial call.
 * @memberOf AbstractLazyLoadComponent
 */
@Injectable()
export class LazyLoaderService {
  initiator$ = new Subject<CustomLazyLoad>();

  triggerInitialLoad(initiate = true) {
    this.initiator$.next({ load: initiate });
  }
}
