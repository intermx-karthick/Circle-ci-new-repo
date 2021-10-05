import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AuthGuard} from '@shared/guards/auth.guard';
import {PlacesComponent} from './places.component';
import {AccessGuard} from '@shared/guards/access.guard';
import { PlaceSetResolver } from '@shared/resolvers/place-set.resolver';
import { DefaultAudienceResolver } from '@shared/resolvers/default-audience.resolver';

@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: PlacesComponent,
        canActivate: [ AuthGuard ],
        canActivateChild: [ AccessGuard ],
        // removed resolver due to {@see https://intermx.atlassian.net/browse/IMXUIPRD-1762}
        // resolve: {existingPlaseSet: PlaceSetResolver}
        resolve: {defaultAudience: DefaultAudienceResolver},
        data: { title: 'Places' , module: 'explore' }
      }
    ])
  ],
  declarations: [],
  exports: [ RouterModule ]
})

export class PlacesRoutingModule {}
