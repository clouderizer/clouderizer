import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: 'settings',
    canActivate: [AuthGuard],
    loadChildren: () => import('./settings/settings.module').then(rm => rm.SettingsModule)
  },
  {
    path: 'serving',
    canActivate: [AuthGuard],
    loadChildren: () => import('./serving/serving.module').then(rm => rm.ServingModule)
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then(rm => rm.AuthModule)
  },
  {
    path: '',
    redirectTo: 'serving',
    pathMatch: 'full',
  }
  ]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
