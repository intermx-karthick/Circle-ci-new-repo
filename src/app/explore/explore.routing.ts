import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';
import {AuthGuard} from '@shared/guards/auth.guard';
import {ExploreComponent} from './explore.component';
import {AccessGuard} from '@shared/guards/access.guard';
import { DefaultAudienceResolver } from '@shared/resolvers/default-audience.resolver';
import { MarketsDummyResolver } from '@shared/resolvers/markets-dummy.resolver';
import { CountiesResolver } from '@shared/resolvers/counties.resolver';
@NgModule({
  imports: [
    RouterModule.forChild([
      {
        path: '',
        component: ExploreComponent,
        canActivate: [ AuthGuard, AccessGuard ],
        data: { title: 'Explore', module: 'explore' },
        resolve: {
          dummyMarkets: MarketsDummyResolver,
          defaultAudience: DefaultAudienceResolver,
          counties: CountiesResolver,
        }
      }
    ])
  ],
  declarations: [],
  exports: [ RouterModule ]
})

export class ExploreRouting { }
