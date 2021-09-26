import { Injectable } from '@angular/core';
import {HttpRequest, HttpClient, HttpHeaders} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Observable} from 'rxjs/Observable';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

@Injectable()
export class fileService {
    isDev:boolean;
    constructor(
        private http: HttpClient,
        private authService: AuthService
    ){
        this.isDev = false;
    }

    uploadfileAWSS3(fileuploadurl, contenttype, file): Observable<any>{ 
        //this will be used to upload all csv files to AWS S3
        const headers = new HttpHeaders().append('Content-Type', contenttype);
        console.log(headers);
        const req = new HttpRequest('PUT', fileuploadurl, file,
        {
        headers: headers
        });
        return this.http.request(req);
    }

    getpresignedurls(fileName, companyId, type): Observable<any>{
        // this.user = this.authService.loggedInUser();
        // console.log(this.user);
        let ep = this.prepEndpoint("api/awsconfig/generatepresignedurl");
        let getheaders = new HttpHeaders().append('Content-Type','application/json');
        console.log(getheaders);
        console.log(fileName);
        return this.http.post(ep, {"company": companyId, "type": type, "key": fileName}, { headers: getheaders});
    }

    prepEndpoint(ep){
        // if(this.isDev){
        //   console.log("is dev");
        //   return ep;
        // } else {
        //   if(ep.indexOf('predict') >= 0){
        //     return document.location.protocol +'//'+ document.location.hostname + '/userserving/'+ ep;
        //   }
        //   console.log("not is dev");
        //   console.log(ep);
        //   return document.location.protocol +'//'+ document.location.hostname + '/'+ ep;
        // }

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