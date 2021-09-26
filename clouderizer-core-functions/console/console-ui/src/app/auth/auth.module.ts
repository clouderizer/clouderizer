import 'hammerjs';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthRoutingModule } from './auth.routing';
import { LoginComponent } from './login/login.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { MaterialModule } from '../material-modules';
import { RecaptchaModule } from 'ng-recaptcha';
import { ConfirmComponent } from './confirm/confirm.component';
import { ResetPwdComponent } from './resetpwd/resetpwd.component';
import { NgxIntlTelInputModule } from 'ngx-intl-tel-input';
import { AuthComponent } from './auth.component';


@NgModule({
  declarations: [ 
    LoginComponent, 
    ConfirmComponent,
    ResetPwdComponent,
    AuthComponent
  ],
  imports: [
    CommonModule,
    NgxIntlTelInputModule,
    AuthRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RecaptchaModule
  ]
})
export class AuthModule { }
