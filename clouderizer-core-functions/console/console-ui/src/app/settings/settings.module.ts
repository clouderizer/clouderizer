import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterModule,  } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MomentModule } from 'angular2-moment';
import { SettingsComponent } from './settings.component';
import { SettingsRoutes } from './settings.routing';
import { NgxSmartModalService, NgxSmartModalModule } from 'ngx-smart-modal';
import { FileUploadModule } from 'ng2-file-upload';
import { ProfileSettingsComponent } from './profile/profile-settings.component';
import { ManageUsersComponent } from './users/manage-users.component';
import { CloudSettingsComponent } from './cloud/cloud-settings.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { MaterialModule } from '../material-modules';
import { CounterInputComponent } from './subscription/subscription.directive';
import { ReinviteComponent} from './reinvite/reinvite.component';
import { NavbarModule} from '../shared/navbar/navbar.module';
import { SidebarModule } from '../shared/left-sidebar/left-sidebar.module';

@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(SettingsRoutes),
        FormsModule,
        ReactiveFormsModule,
        MomentModule,
        MaterialModule,
        FileUploadModule,
        SidebarModule,
        NavbarModule,
        NgxSmartModalModule.forChild()
    ],
    declarations: [
        SettingsComponent,
        ProfileSettingsComponent,
        ManageUsersComponent,
        CloudSettingsComponent,
        SubscriptionComponent,
        CounterInputComponent,
        ReinviteComponent
    ],
    providers: [ NgxSmartModalService ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    entryComponents: [ReinviteComponent]
})

export class SettingsModule {}
