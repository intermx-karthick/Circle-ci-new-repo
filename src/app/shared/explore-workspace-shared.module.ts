import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ExploreDataService} from './services/explore-data.service';
import {WorkSpaceService} from './services/work-space.service';
import {WorkSpaceDataService} from './services/work-space-data.service';
import {TargetAudienceService} from './services/target-audience.service';

// resolvers
import {ProjectsResolver} from './resolvers/projects.resolver';
import {MarketsResolver} from './resolvers/markets.resolver';
import {MarketsDummyResolver} from './resolvers/markets-dummy.resolver';
import {OperatorsResolver} from './resolvers/operators.resolver';
import {DefaultAudienceResolver} from './resolvers/default-audience.resolver';
import {PlaceSetResolver} from './resolvers/place-set.resolver';
import {PackagesResolver} from './resolvers/packages.resolver';
import {SavedAudienceResolver} from '@shared/resolvers/saved-audience.resolver';
import {CountiesResolver} from './resolvers/counties.resolver';
@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
  ],
  exports: [
  ],
  providers: [
    ExploreDataService,
    WorkSpaceService,
    WorkSpaceDataService,
    TargetAudienceService,
    PlaceSetResolver,
    ProjectsResolver,
    MarketsResolver,
    MarketsDummyResolver,
    OperatorsResolver,
    DefaultAudienceResolver,
    PackagesResolver,
    SavedAudienceResolver,
    CountiesResolver
  ]
})
export class ExploreWorkspaceSharedModule {}
