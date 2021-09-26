import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {ServingmodelComponent} from './servingmodel/servingmodel.component'

const routes: Routes = [
  // {
  //   path: '',
  //   redirectTo: 'servingmodel',
  //   pathMatch: 'full',
  // },
  // {
  //   path: 'servingmodel',
  //   component: ServingmodelComponent
  // },
  {
    path: ':id',
    component: ServingmodelComponent
  }
  
]
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]

})


export class AppRoutingModule { }
