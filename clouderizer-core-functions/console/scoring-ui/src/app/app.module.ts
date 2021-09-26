import { BrowserModule } from '@angular/platform-browser';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { NavheaderComponent } from './navheader/navheader.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ServingmodelComponent } from './servingmodel/servingmodel.component';
import {MatStepperModule} from '@angular/material/stepper';
import {MatIconModule} from '@angular/material/icon';
import {WebcamModule} from 'ngx-webcam';
import { ConfirmationModalComponent } from './confirmation-modal/confirmation-modal.component';
import { CaptureModalComponent } from './capture-modal/capture-modal.component';
import { PreloaderComponent } from './preloader/preloader.component';
import { MaterialModule } from './material-module';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AuthService } from './services/auth.service';
import { NotifyService } from './services/notify.service';
import { HttpModule } from '@angular/http';

import { ModalPopupBrowseComponent } from './modal-popup-browse/modal-popup-browse.component';
import { ActualOutputComponent } from './actualOutput/actualOutput.component';
import {KeywordValidatorDirective} from './modal-popup-browse/keyword-validator.directive';
import { DragDropDirective } from './dragndrop.directive';
import {MainPipe} from './pipemodule/pipe.module';
import { fileService } from './services/fileupload.service';
import { HttpClientModule } from '@angular/common/http';
import { NgxSpinnerModule } from 'ngx-spinner';
import { VersionCheckService } from './services/versionCheck.service';
import { NgApexchartsModule } from "ng-apexcharts";
// import {invalidValidatorDirective} from './servingmodel/invalidValue.validator'

@NgModule({
  declarations: [
    AppComponent,
    CaptureModalComponent,
    NavheaderComponent,
    ServingmodelComponent,
    ConfirmationModalComponent,
    PreloaderComponent,
    ActualOutputComponent,
    ModalPopupBrowseComponent,
    KeywordValidatorDirective,
    DragDropDirective
    // invalidValidatorDirective
  ],
  imports: [
    HttpClientModule,
    NgxSpinnerModule,
    MainPipe,
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    BrowserAnimationsModule,
    MatStepperModule,
    MatIconModule,
    WebcamModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    NgApexchartsModule
  ],
  exports:[BrowserModule],
  providers: [NotifyService, AuthService, fileService, VersionCheckService],
  bootstrap: [AppComponent],
  entryComponents: [CaptureModalComponent, ConfirmationModalComponent, ActualOutputComponent, ModalPopupBrowseComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA,
  ]
})
export class AppModule { }
