import { Component, OnInit, ViewChild, } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NavbarComponent } from '../shared/navbar/navbar.component';

@Component({
  selector: 'app-serving',
  templateUrl: './serving.component.html',
  styleUrls: ['./serving.component.scss']
})
export class ServingComponent implements OnInit {
  public showSidebar = true;
  user:any;
  constructor(
    private router: Router,
    public authService: AuthService,
  ) { 
  }

  @ViewChild('leftSidebar', {static: false}) sidebar;
  @ViewChild(NavbarComponent, {static: false}) navbar: NavbarComponent;

  ngOnInit() {
  }
}
