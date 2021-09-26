import { Routes } from '@angular/router';
import {NewServingComponent} from './new-serving/new-serving.component';
import {ServingComponent} from './serving.component';
import {ServingModelComponent} from './serving-model/serving-model.component';
import {DeployServingComponent} from './deploy-serving/deploy-serving.component';
import { AuthGuard } from '../guards/auth.guard';

export const ServingRoutes: Routes = [
  {
    path: '',
    redirectTo: 'model',
    pathMatch: 'full',
  },
  {
    path: '',
    component: ServingComponent,
    children: [{
      path: 'new',
      canActivate: [AuthGuard],
      component: NewServingComponent
    }]
  },
  {
    path: '',
    component: ServingComponent,
    children: [{
      path: 'model',
      canActivate: [AuthGuard],
      component: ServingModelComponent
    }]
  },
  {
    path: '',
    component: ServingComponent,
    children: [{
      path: 'dashboard',
      canActivate: [AuthGuard],
      component: DeployServingComponent
    }]
  }
];
