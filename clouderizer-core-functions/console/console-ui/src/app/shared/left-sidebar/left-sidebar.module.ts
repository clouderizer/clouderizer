import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LeftSidebarComponent } from './left-sidebar.component';

@NgModule({
    imports: [ RouterModule, CommonModule ],
    declarations: [ LeftSidebarComponent ],
    exports: [ LeftSidebarComponent ]
})

export class SidebarModule {}
