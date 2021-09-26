import { BrowserModule } from '@angular/platform-browser';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MaterialModule } from './material-modules';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {ValidateService} from './services/validate.service';
import {AuthService} from './services/auth.service';
import {GetServerlessUrl} from './services/getServerlessUrl.service';
import {fileService} from './services/s3fileupload.service';
import {sharedService} from './services/shared.service';
import {NotifyService} from './services/notify.service';
import {MiscService} from './services/misc.service';
import {ProjectService} from './services/project.service';
import {ZipService} from './services/zip.service';
import {ZipDataService} from './services/zipdata.service';
import { HttpModule } from '@angular/http';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import {AuthGuard} from './guards/auth.guard';
import { SettingsModule } from './settings/settings.module';
import { ServingModule } from './serving/serving.module';
import { SailsSocketService } from './services/sailssocket.service';
import { VersionCheckService } from './services/versionCheck.service';
import { NgxSmartModalService} from 'ngx-smart-modal';
import { SailsModule } from "angular2-sails";
import { LoadingScreenInterceptor } from "./loader/loading.interceptor";
import { LoadingScreenComponent } from './loader/loading-screen.component';
import { NgbActiveModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoaderComponent } from './shared/loader/loader.component';
import {MainPipe} from './pipemodule/pipe.module';
import { CliModalComponent } from './serving/cli-modal/climodal.component';
import { ModalPopupBrowseComponent } from './serving/modal-popup-browse/modal-popup-browse.component';
import { PopupMoredetailsComponent } from './serving/popup-moredetails/popup-moredetails.component';
import { errorMetricsComponent } from './serving/errorMetrics/errorMetrics.component';
import { NewProjectModalComponent } from './serving/new-project-modal/new-project-modal.component';
import {CopyProjectModalComponent} from './serving/copy-project-modal/copyprojectmodal.component';
import { StartProjectModalComponent} from './serving/start-project-modal/startprojectmodal.component';
import { NotebookVariableModalComponent } from './serving/notebookvariable-modal/notebookvariable-modal.component';
import { sdkComponent} from './serving/sdk/sdk.component';
import { codeEditor} from './serving/codeEditor/codeEditor.component';
import { bannerImage } from './serving/bannerImageModal/bannerImage.component';
import { retrain } from './serving/retrainModal/retrain.component';
import { ActualOutputComponent } from './serving/actualOutput/actualOutput.component';
import { QuotaModalComponent } from './serving/quota-modal/quota-modal.component';
import { errorModal } from './serving/errorModal/errorModal.component';
import { DragDropDirective } from './serving/dragndrop.directive';
import {AutofocusDirective} from './serving/matInputfocus.directive';
import { NumberDirective } from './serving/integer.directive';
import {
  HighlightModule,
  HIGHLIGHT_OPTIONS,
  HighlightOptions
} from "ngx-highlightjs";
import hljs from 'highlight.js';
document.defaultView['hljs'] = hljs;
import 'highlightjs-line-numbers.js';


@NgModule({
  declarations: [
    AppComponent,
    LoadingScreenComponent,
    LoaderComponent,
    CliModalComponent,
    sdkComponent,
    codeEditor,
    bannerImage,
    retrain,
    errorMetricsComponent,
    ActualOutputComponent,
    NotebookVariableModalComponent,
    QuotaModalComponent,
    NewProjectModalComponent,
    PopupMoredetailsComponent,
    ModalPopupBrowseComponent,
    CopyProjectModalComponent,
    StartProjectModalComponent,
    DragDropDirective,
    AutofocusDirective,
    NumberDirective,
    errorModal
  ],
  imports: [
    MainPipe,
    MatProgressSpinnerModule,
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    MaterialModule,
    HighlightModule,
    HttpModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    SailsModule.forRoot(),
    NgbModule,
    MatTooltipModule
  ],
  exports:[BrowserModule],
  entryComponents: [CliModalComponent, NotebookVariableModalComponent, QuotaModalComponent, errorModal, ActualOutputComponent, errorMetricsComponent,retrain, bannerImage, codeEditor,sdkComponent, NewProjectModalComponent, ModalPopupBrowseComponent,PopupMoredetailsComponent, CopyProjectModalComponent, StartProjectModalComponent],
  providers: [VersionCheckService, sharedService, ValidateService, fileService, GetServerlessUrl, AuthService, AuthGuard, NotifyService,  MiscService, ProjectService, ZipService, SailsSocketService, ZipDataService, NgxSmartModalService, NgbActiveModal,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingScreenInterceptor,
      multi: true
    },
    { 
      provide: HIGHLIGHT_OPTIONS,
      useValue: <HighlightOptions>{
        lineNumbers: true
      }
    }],
  bootstrap: [AppComponent],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA
  ],
})
export class AppModule { }
