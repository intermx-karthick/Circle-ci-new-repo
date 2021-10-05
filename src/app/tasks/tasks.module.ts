import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { SharedModule } from "@shared/shared.module";
import { TasksComponent } from "./tasks.component";
import { TasksRoutingModule } from "./tasks.routing.module";

@NgModule({
    imports: [
        CommonModule,
        TasksRoutingModule,
        SharedModule,
    ],
    declarations: [TasksComponent],
    exports: []
})

export class TasksModule { }