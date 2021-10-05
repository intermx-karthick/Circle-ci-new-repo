import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AccessGuard } from "@shared/guards/access.guard";
import { AuthGuard } from "@shared/guards/auth.guard";
import { ExportSearchComponent } from "./billing-exports/export-search/export-search.component";


import { ContractsManagementComponent } from "./contracts-management.component";
import { ContractDetailsComponent } from "./contracts/contracts-list/contract-details/contract-details.component";
import { ContractsListComponent } from "./contracts/contracts-list/contracts-list.component";
import { ContractsComponent } from "./contracts/contracts.component";
import { LineItemsComponent } from './line-items/line-items.component';
import { VendorContractsComponent } from "./vendor-contracts/vendor-contracts/vendor-contracts.component";
import { InsertionOrdersComponent } from "./insertion-orders/insertion-orders.component";
import { InsertionOrdersListComponent } from "./insertion-orders/insertion-orders-list/insertion-orders-list.component";
import { ArchivedExportsComponent } from "./archived-exports/archived-exports.component";
import { UserPermissionGuard } from "@shared/guards/user-permission.guard";

const routes: Routes = [
    {
        path: '',
        component: ContractsManagementComponent,
        data: { title: 'Contracts', module: 'contractManagement' },
        canActivate: [AuthGuard, AccessGuard],
        canActivateChild: [AccessGuard],
        children: [
            {
                path: '',
                redirectTo: 'contracts',
                pathMatch: 'full'
            },
            {
                path: 'contracts',
                component: ContractsComponent,
                data: {
                    title: 'Contracts', module: 'contractManagement',
                    submodule: 'contract', redirectURL: 'contracts-management/billing-exports'
                },
                canActivate: [UserPermissionGuard],
                children: [
                    {
                        path: '',
                        component: ContractsListComponent,
                        data: { title: 'Contracts', module: 'contractManagement' },
                    },
                    {
                        path: ':id',
                        component: ContractDetailsComponent,
                        data: { title: 'Contracts', module: 'contractManagement' },
                    }
                ]
            },
            {
                path: 'vendor-contracts',
                component: VendorContractsComponent,
                canActivate: [UserPermissionGuard],
                data: { title: 'Contracts', module: 'contractManagement', submodule: 'vendorContract' , redirectURL: '/'},
                children: []
            },
            {
                path: 'line-items',
                canActivate: [UserPermissionGuard],
                data: { title: 'Line Items', module: 'contractManagement', submodule: 'lineItems' , redirectURL: '/'},
                component: LineItemsComponent
            },
            {
                path: 'billing-exports',
                component: ExportSearchComponent,
                canActivate: [UserPermissionGuard],
                data: { title: 'Billing Exports', module: 'contractManagement', submodule: 'billingExports', redirectURL: '/' },
                children: []
            },
            {
                path: 'insertion-orders',
                component: InsertionOrdersComponent,
                canActivate: [UserPermissionGuard],
                data: { title: 'Insertion Orders', module: 'contractManagement', submodule: 'insertionOrders' , redirectURL: '/'},
                children: [
                    {
                        path: '',
                        component: InsertionOrdersListComponent,
                        data: { title: 'Insertion Orders', module: 'contractManagement' },
                    }
                ]
            },
            {
                path: 'archived-exports',
                component: ArchivedExportsComponent,
                canActivate: [UserPermissionGuard],
                data: { title: 'Archived Exports', module: 'contractManagement', submodule: 'archivedExports' , redirectURL: '/'},
            },
        ]
    }
]

@NgModule({
    imports: [RouterModule.forChild(routes)],
    declarations: [],
    exports: [RouterModule]
})
export class ContractsRoutingModule { }
