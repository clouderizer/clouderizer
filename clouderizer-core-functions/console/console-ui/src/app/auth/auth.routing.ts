import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { ConfirmComponent } from './confirm/confirm.component';
import { ResetPwdComponent } from './resetpwd/resetpwd.component';
import { AuthComponent } from './auth.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children:
        [
            {
                path: 'login',
                component: LoginComponent,
            },
            {
              path: 'confirm',
              component: ConfirmComponent
            },
            {
              path: 'resetpwd',
              component: ResetPwdComponent
            }
        ]
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
