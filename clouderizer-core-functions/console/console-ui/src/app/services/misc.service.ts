
import { Injectable } from '@angular/core';
import * as moment from 'moment';

@Injectable()
export class MiscService {
  testAccountIDs = [
    "d2aa8b0f-8e4c-4e37-895f-2ddbf2a824b4",
    "e6933557-1b28-49a4-a7f0-fab700695214",
    "2b593c02-ab5e-489b-8c1b-56983e9f5f82",
    "af4a7b86-c13c-4e39-8fbc-e30bb9b7106a",
    
    //beta db
    "eaf89eca-71dd-4db4-a984-647c7031b347",
    "8d720dab-577d-4040-a1b5-6d9f39581e9a",
    "0a22f7f2-4101-4bda-9501-4c515e367858"

  ];

  public showDrive:boolean;
  copyProjectNeedRefresh:boolean;
  startProjectNeedRefresh:boolean;
  shareProjectNeedRefresh:boolean;
  
  isTestAccount(company) {
    for(var i=0;i< this.testAccountIDs.length;i++) {
      if(this.testAccountIDs[i] == company.id) {
        return true;
      }
    }
    return false;
  }

  setShowDrive(show) {
    this.showDrive = show;
  }

  getShowDrive() {
    return this.showDrive;
  }

  setCopyProjectNeedRefresh(val) {
    this.copyProjectNeedRefresh = val;
  }

  getCopyProjectNeedRefresh() {
    return this.copyProjectNeedRefresh;
  }

  setStartProjectNeedRefresh(val) {
    this.startProjectNeedRefresh = val;
  }

  getStartProjectNeedRefresh() {
    return this.startProjectNeedRefresh;
  }

  setShareProjectNeedRefresh(val) {
    this.shareProjectNeedRefresh = val;
  }

  getShareProjectNeedRefresh() {
    return this.shareProjectNeedRefresh;
  }

  getNonCommericalMessage() {
    return "You are using a free non-commercial license. Please switch to open license or enterprise license in case you are using Clouderizer for your business or for commercial use. Contact sales@clouderizer.com for details.";
  }

  checkAndShowNotification(user, sailsSocketService) {
    if(user && sailsSocketService) {
      if(user.company.planName == 'freecloud') {
        sailsSocketService.addNotification({
          msdid: 0,
          message: this.getNonCommericalMessage()
        })
      }
    }

  }
}

