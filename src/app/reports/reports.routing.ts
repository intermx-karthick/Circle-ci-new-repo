import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from '@shared/guards/auth.guard';
import { ReportsComponent } from './reports.component';
import { ReportsTableauImpVariationComponent } from './reports-tableau-imp-variation/reports-tableau-imp-variation.component';
import { ReportsHomeComponent } from './reports-home/reports-home.component';
import { AccessGuard } from '@shared/guards/access.guard';
import { ReportsImpressionVariationComponent } from './reports-impression-variation/reports-impression-variation.component';
import { ReportsTableauReportsComponent } from './reports-tableau-reports/reports-tableau-reports.component';
import { ReportsOrganizationComponent } from './reports-organization/reports-organization.component';
import { TableauVisualiserResolver } from './resolvers/tableau-visualiser.resolver';
const routes: Routes = [
    {
        path: '',
        component: ReportsComponent,
        canActivate: [AuthGuard],
        canActivateChild: [AccessGuard],
        data: {
            title: 'Reports',
            module: 'reports'
        },

        children: [
            {
                path: '',
                redirectTo: 'weekly_imp_variation/report',
                pathMatch: 'full'
            },
            {
                path: 'home',
                component: ReportsHomeComponent,
                data: { title: 'Reports', module: 'reports' }
            },
            {
                path: ':id/report',
                component: ReportsTableauReportsComponent,
                data: { title: 'Reports',  module: 'reports', submodule: 'subReports',  redirectURL:'reports/cbsa_report/report' },
                resolve: { visualiserURLs: TableauVisualiserResolver }
            },
            {
                path: 'impression-variation-dashboard',
                component: ReportsTableauImpVariationComponent,
                data: { title: 'Impression Variation', module: 'reports' }
            },
            {
                path: 'impression-variation',
                component: ReportsImpressionVariationComponent,
                data: { title: 'Impression Variation', module: 'reports' }
            },
            {
                path: 'organization',
                component: ReportsOrganizationComponent,
                data: { title: 'Reports', module: 'reports', submodule: 'reports',  redirectURL:'/' }
            }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    declarations: [],
    exports: [RouterModule]
})
export class ReportsRouting {}
