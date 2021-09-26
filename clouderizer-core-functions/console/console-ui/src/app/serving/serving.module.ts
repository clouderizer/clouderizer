import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentModule } from 'angular2-moment';
import { TagInputModule } from 'ngx-chips';
import { NgxSmartModalService, NgxSmartModalModule } from 'ngx-smart-modal';
import { ServingRoutes } from './serving.routing';
import { MaterialModule } from '../material-modules';
import { DeployServingComponent } from './deploy-serving/deploy-serving.component';
import { NewServingComponent } from './new-serving/new-serving.component';
import { ServingComponent } from './serving.component';
import { ServingModelComponent } from './serving-model/serving-model.component';
import { NgxSpinnerModule } from 'ngx-spinner';
import {MatInputModule} from '@angular/material';
import {MainPipe} from '../pipemodule/pipe.module';
import { NgApexchartsModule } from "ng-apexcharts";

import { ButtonSelectComponent } from './buttonselect/buttonselect.component';
import { NavbarModule} from '../shared/navbar/navbar.module';
import { SidebarModule } from '../shared/left-sidebar/left-sidebar.module';


@NgModule({
    imports: [
        MainPipe,
        CommonModule,
        NgxSpinnerModule,
        RouterModule.forChild(ServingRoutes),
        FormsModule,
        MomentModule,
        MaterialModule,
        MatInputModule,
        TagInputModule,
        ReactiveFormsModule,
        NgxSmartModalModule.forChild(),
        NgApexchartsModule,
        SidebarModule,
        NavbarModule
    ],
    declarations: [
        DeployServingComponent,
        ButtonSelectComponent,
        NewServingComponent,
        ServingComponent,
        ServingModelComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})

export class ServingModule {}

