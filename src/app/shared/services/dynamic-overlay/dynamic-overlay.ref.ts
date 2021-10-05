import { Subject } from 'rxjs';
import { OverlayRef } from '@angular/cdk/overlay';

export class DynamicOverlayRef {

    dataSource$ = new Subject();

    constructor(
        private overlayRef: OverlayRef,
        public data: any
    ) {
    }

    close(data) {
        this.overlayRef.detach();
        this.overlayRef.dispose();
        this.dataSource$.next({
            data
        });
        this.dataSource$.complete();
    }

    afterClosed() {
        return this.dataSource$.asObservable();
    }

}
