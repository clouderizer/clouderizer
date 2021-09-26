import { Routes } from '@angular/router';
import { ProfileSettingsComponent } from './profile/profile-settings.component';
import { ManageUsersComponent } from './users/manage-users.component';
import { CloudSettingsComponent } from './cloud/cloud-settings.component';
import { SubscriptionComponent } from './subscription/subscription.component';
import { SettingsComponent } from './settings.component';
export const SettingsRoutes: Routes = [ 
{
  path: '',
  redirectTo: 'profile',
  pathMatch: 'full',
},
{
    path: '',
    component: SettingsComponent,
    children: [{
        path: 'profile',
        component: ProfileSettingsComponent
    }]
}, {
    path: '',
    component: SettingsComponent,
    children: [{
        path: 'users',
        component: ManageUsersComponent
    }]
}, {
    path: '',
    component: SettingsComponent,
    children: [{
        path: 'cloud',
        component: CloudSettingsComponent
    }]
}, {
    path: '',
    component: SettingsComponent,
    children: [{
        path: 'subscription',
        component: SubscriptionComponent
    }]
}
];
