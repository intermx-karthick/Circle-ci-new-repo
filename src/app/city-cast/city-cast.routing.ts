import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CityCastComponent } from './city-cast.component';
import { CityCastHomeComponent } from './city-cast-home/city-cast-home.component';

const routes: Routes = [
  {
    path: '',
    component: CityCastComponent,
    data: { title: 'CityCast', module: 'networkLibrary' },
    children: [
      {
        path: '',
        component: CityCastHomeComponent,
        data: { title: 'CityCast', module: 'networkLibrary' }
      },
      {
        path: 'home',
        component: CityCastHomeComponent,
        data: { title: 'CityCast', module: 'networkLibrary' }
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  declarations: [],
  exports: [RouterModule]
})
export class CityCastRouting { }
