import { Component, OnInit } from '@angular/core';
import {SailsSocketService} from './services/sailssocket.service';
import { VersionCheckService } from './services/versionCheck.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private sailsSocketService: SailsSocketService,
    private versionCheckService: VersionCheckService
  ) {}

  ngOnInit() {
  var url='api/versionCheck';
  this.versionCheckService.initVersionCheck(url);
  this.sailsSocketService.connectSocket();
 }
}
