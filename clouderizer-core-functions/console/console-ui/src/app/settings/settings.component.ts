import { Component, ViewChild, OnInit } from '@angular/core';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  public showSidebar = true;
  constructor() { }

  @ViewChild('leftSidebar', {static: false}) sidebar;
  @ViewChild(NavbarComponent, {static: false}) navbar: NavbarComponent;

  ngOnInit() {
    console.log("inside settings");
  }
}

