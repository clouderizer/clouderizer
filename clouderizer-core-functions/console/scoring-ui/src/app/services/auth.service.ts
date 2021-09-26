import { Injectable } from '@angular/core';
import {Http, Headers} from '@angular/http';
import 'rxjs/add/operator/map';
//import {tokenNotExpired} from 'angular2-jwt';
import { Router } from '@angular/router';
import { NotifyService } from './notify.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { environment } from '../../environments/environment';

declare var $: any;

@Injectable()
export class AuthService {
  authToken: any;
  user: any;
  isDev:boolean;
  public isBusy:BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public childWindows: Array<any>;

  constructor(
    private http:Http,
    private route:Router,
    private notifyService:NotifyService
  ) {
    this.isDev = false; // Change to false before deployment
    this.isBusy.next(false);
    this.childWindows = new Array<Object>();
  }

  httpService(path, obj, verb, scallback, ecallback, showLoading = true, display=true, customheaders = null) {
    let headers = new Headers();
    // headers.append('Content-Type','application/json');
    if(path.indexOf('api/') == -1){
      headers.append('X-browser','yes');
    }
    if(customheaders){
      for(var i=0;i<customheaders.length;i++){
        // var k1:any = Object.values(customheaders[i])[0];
        headers.append(Object.keys(customheaders[i])[0], <any>Object.values(customheaders[i])[0])
      }
    }
    let ep = this.prepEndpoint(path);
    var http_req = null;
    
    switch(verb) {
      case 'get': {
        if(obj != null) {
          ep = ep + '/' + obj;
          console.log(ep);
        }
        console.log(ep)
        if(ep.indexOf('projectdetails') >= 0){
          headers.append('Cache-Control', 'no-cache');
        }
        http_req = this.http.get(ep, {headers: headers})
                            .map(res => res.json());
        break;
      }

      case 'put': {
        if(obj != null) {
          ep = ep + '/' + obj.id;
        }
        http_req = this.http.put(ep, obj, {headers: headers})
                            .map(res => res.json());
        break;
      }

      case 'post': {
        http_req = this.http.post(ep, obj, {headers: headers})
                            .map(res => res.json());
        break;
      }

      case 'delete': {
        if(obj != null) {
          ep = ep + '/' + obj.id;
        }
        http_req = this.http.delete(ep, {headers: headers})
                            .map(res => res.json());
        break;
      }
    }

    this.isBusy.next(true);
    
    if(showLoading) {
      $('#loading').show();
    }
    
    http_req.subscribe(data => {
      this.isBusy.next(false);
      if(showLoading) {
        $('#loading').hide();
      }
      scallback(data)
    }, err => {
      this.isBusy.next(false);
      if(showLoading) {
        $('#loading').hide();
      }
      
      var message = "Some error occured. Please try later.";
      if (err.status == 401) {
        message = 'Your session has expired. Please login again.'
        this.logout();
      }

      if(err._body) {
        try {
          var res = JSON.parse(err._body);
          //var message = "Some error occured. Please try later.";
          
          if(res) {
            if(res.msg) {
              message = res.msg;
            } else if(res.err) {
              message = res.err;
            } else if(res.message) {
              message = res.message;
            }
          }
          if(display) {
            var messagetype = message.toLowerCase() == 'model is still loading' ? 'info' : 'danger';
            this.notifyService.notify(message, messagetype);
          }
          if(err.status == 401 && message == 'Logged out'){
            window.location.reload();
          }
        } catch (e) {
          //console.log(e);
        }
      }
      ecallback(err);
    });
  }


  loggedIn(){
    return localStorage.getItem('loggedIn') == 'true';
  }

  logout(){
    localStorage.setItem('loggedIn', 'false');
    localStorage.setItem('user', null);
    this.childWindows.forEach((win) => {
      win.close();
    });
  }

  login(obj){
    localStorage.setItem('loggedIn', 'true');
    localStorage.setItem('user', JSON.stringify(obj));
  }

  loggedInUser() {
    if(this.loggedIn()) {
      var usr_string = localStorage.getItem('user');
      if(usr_string) {
        return JSON.parse(usr_string);
      }
      return null;
    } else {
      return null;
    }
    
  }

  setLoggedInUser(obj) {
    if(this.loggedIn()) {
      localStorage.setItem('user', JSON.stringify(obj));
    }
  }

  prepEndpoint(ep){
    if(this.isDev){
      console.log("is dev");
      return ep;
    } else {
      console.log("predict index", ep.indexOf('predict'));
      if(ep.indexOf('api/') >= 0){
        return environment.baseurl + '/' + ep;
      }
      console.log("not is dev");
      console.log(ep);
      return document.location.protocol +'//'+ document.location.hostname + '/'+ ep;
    }
  }
}
