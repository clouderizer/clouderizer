import { Injectable } from '@angular/core';
import { SailsService } from "angular2-sails";
import { NotifyService } from './notify.service';
import { AuthService } from './auth.service';
import * as moment from 'moment';

declare var $:any;
declare var swal:any;
declare let io: any;

@Injectable()
export class SailsSocketService {

  private dashboardObject:any;
  private dashboardCallback:any;
  private pprojStatusObject:any;
  private pprojStatusCallback:any;
  private dashboardObjectServing:any;
  private dashboardCallbackServing:any;
  private dashboardCallbackOverall:any;
  private dashboardCallbackCustomer:any;
  private dashboardCallbackHistory:any;
  private dashboardObjectHistory:any;
  private dashboardObjectOverall:any;
  private dashboardObjectCustomer:any;
  private dashboardCallbackJupyter:any;
  private dashboardObjectJupyter:any;
  private notificationList:any;
  private lastMessageTime:Date;
  constructor(
    private _sailsService: SailsService,
    private notifyService: NotifyService,
    private authService: AuthService,
  ) { }

  connectSocket() {
    if(this.authService.loggedIn()) {
      console.log('heart beat...');

      this._sailsService.connect('').subscribe(() => {
        
        this._sailsService.on('connected').subscribe((data) => {
          if(data) {
            console.log("data from connected " + data);
          }
        }, (err) => {
            
        }, () => {
            console.log('OnComplete called');
        }); 

        this._sailsService.on('proj_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.dashboardCallback && this.dashboardObject) {
              this.dashboardCallback(data, this.dashboardObject);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });

        this._sailsService.on('publishedproj_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.pprojStatusCallback && this.pprojStatusObject) {
              this.pprojStatusCallback(data, this.pprojStatusObject);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });
      
        this._sailsService.on('servingproj_status_updated').subscribe((data) => {
          if(data) {
            console.log("model data arrived")
            this.lastMessageTime = new Date();
            if(this.dashboardCallbackServing && this.dashboardObjectServing) {
              console.log("callig update status")
              this.dashboardCallbackServing(data, this.dashboardObjectServing);
            }
            else{
              console.log("no update status")
            }
          }
          else{
            console.log("no model data")
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });

        this._sailsService.on('jupyter_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.dashboardCallbackJupyter && this.dashboardObjectJupyter) {
              this.dashboardCallbackJupyter(data, this.dashboardObjectJupyter);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });


        this._sailsService.on('overall_servingproj_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.dashboardCallbackOverall && this.dashboardObjectOverall) {
              this.dashboardCallbackOverall(data, this.dashboardObjectOverall);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });

        this._sailsService.on('customer_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.dashboardCallbackCustomer && this.dashboardObjectCustomer) {
              this.dashboardCallbackCustomer(data, this.dashboardObjectCustomer);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });

        this._sailsService.on('modelhistory_status_updated').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
            if(this.dashboardCallbackHistory && this.dashboardObjectHistory) {
              this.dashboardCallbackHistory(data, this.dashboardObjectHistory);
            }
          }
        }, (err) => {
            console.log(err);
            setTimeout(() => {
                this.connectSocket();
            }, 2000);
            
        }, () => {
            console.log('OnComplete called for socket event');
        });

        console.log("after proj status2");

        this._sailsService.on('swal').subscribe((data) => {
          console.log(data);
          if(data) {
              swal({
                text: data.msg,
                type: 'warning',
                confirmButtonColor: 'green'
              }).then(function () {
            });
          }
        });
        
        console.log("after proj status3");

        this._sailsService.on('toast_message').subscribe((data) => {
            console.log(data);
            if(data) {
              this.lastMessageTime = new Date();
              if(data.type == 'error') {
                this.notifyService.notify(data.msg, 'danger');
              } else if(data.type == 'info') {
                this.notifyService.notify(data.msg, 'info');
              } else if(data.type == 'warning') {
                this.notifyService.notify(data.msg, 'warning');
              }
            }
        }, (err) => {
            console.log(err);
        });
    
        this._sailsService.on('notification_message').subscribe((data) => {
          if(data) {
            this.lastMessageTime = new Date();
              this.addNotification(data);
          }
        }, (err) => {
          console.log(err);
        });

        this._sailsService.get('/api/clientsocket/projstatus', null).subscribe((data) => {
          console.log("data her" + data);
        }, (err) => {
          console.log("error" + err);
        }, () => {
          console.log("after proj status");  
        }) ;

        this._sailsService.get('/api/clientsocket/publishedprojstatus', null).subscribe((data) => {
          console.log("data her" + data);
        }, (err) => {
          console.log("error" + err);
        }, () => {
          console.log("after proj status");  
        }) ;

      });

   }
 }

  reconnectThread() {
    //reconnect with server every 2 minutes
    setTimeout(() => {
      var reconnect = false;
      if(this.lastMessageTime != null) {
        var lastm = moment(this.lastMessageTime);
        var nowm = moment();
        if(nowm.diff(lastm, 'minutes') > 2) {
          reconnect = true;
        }
      } else {
        reconnect = true;
      }

      if(reconnect) {
        this.connectSocket();
      } else {
        this.reconnectThread();
      }
      
    }, 1000 * 60 * 2);
  }

  registerDashboard(callback, dashboard) {
    this.dashboardObject = dashboard;
    this.dashboardCallback = callback;
  }

  registerPProjStatus(callback, handle) {
    this.pprojStatusObject = handle;
    this.pprojStatusCallback = callback;
  }

  registerDashboardServing(callback, dashboard) {
    this.dashboardObjectServing = dashboard;
    this.dashboardCallbackServing = callback;
  }

  registerDashboardOverall(callback, dashboard) {
    this.dashboardObjectOverall = dashboard;
    this.dashboardCallbackOverall = callback;
  }

  registerDashboardCustomer(callback, dashboard) {
    this.dashboardObjectCustomer = dashboard;
    this.dashboardCallbackCustomer = callback;
  }

  registerDashboardHistory(callback, dashboard) {
    this.dashboardObjectHistory = dashboard;
    this.dashboardCallbackHistory = callback;
  }

  registerDashboardJupyter(callback, dashboard) {
    this.dashboardObjectJupyter = dashboard;
    this.dashboardCallbackJupyter = callback;
  }

  registerNotification(notif) {
    this.notificationList = notif;
  }

  addNotification(data) {
    if(data && this.notificationList) {
      var msgid = data.msgid;
      for(var i=0;i<this.notificationList.length;i++) {
        var m = this.notificationList[i];
        if(m.msgid == msgid) {
          this.notificationList[i] = data;
          return;
        }
      }
      this.notificationList.push(data);
    }
  }

  get(url, data) {
    return this._sailsService.get(url, data)
  }
}
