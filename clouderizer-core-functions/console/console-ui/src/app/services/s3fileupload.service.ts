
import { Injectable } from '@angular/core';
//import {Http} from '@angular/http';
import {HttpRequest, HttpClient, HttpHeaders} from '@angular/common/http';
import 'rxjs/add/operator/map';
import {Observable} from 'rxjs/Observable';
import { AuthService } from './auth.service';
import {Http, Headers} from '@angular/http';

@Injectable()
export class fileService {
    private getpresignedurlsserver: string;
    public user:any;
    isDev:boolean;
    constructor(
        private http: HttpClient,
        public authService: AuthService,
        private http2: Http
    ){
        this.isDev = false; // True for dev/local testing else false
    }
    ngOninit(){
        this.user = this.authService.loggedInUser();
        console.log(this.user);
    }
    getpresignedurls(fileName, type, ctype=""): Observable<any>{
        this.user = this.authService.loggedInUser();
        console.log(this.user);
        let ep = this.prepEndpoint("api/awsconfig/generatepresignedurl");
        let getheaders = new HttpHeaders().append('Content-Type','application/json');
        console.log(getheaders);
        console.log(this.user.id);
        console.log("ctype", ctype)
        return this.http.post(ep, {"company": this.user.company.id, "id": this.user.id, "type": type, "key": fileName, "ctype": ctype}, { headers: getheaders});
    }

    uploadfileAWSS3(fileuploadurl, file): Observable<any>{ 
        //this will be used to upload all csv files to AWS S3
         const headers = new HttpHeaders();
         console.log(headers);
         const req = new HttpRequest('PUT', fileuploadurl, file,
         {
           headers: headers,
           reportProgress: true, //This is required for track upload process
         });
         return this.http.request(req);
    }

    getfileAWSS3(fileurl): Observable<any>{ 
      //this will be used to upload all csv files to AWS S3
       const headers = new HttpHeaders();
       headers.append('Accept', '*/*')
       console.log(headers);
       const req = new HttpRequest('GET', fileurl,
       {
         headers: headers,
         responseType: 'blob',
         reportProgress: true,
       });
       return this.http.request(req);
    }

    parses3File(endpoint, s3Url, modelId): Observable<any>{
        this.user = this.authService.loggedInUser();
        console.log(this.user);
        let ep = this.prepEndpoint(endpoint);
        console.log(ep);
        let getheaders = new HttpHeaders().append('Content-Type','application/json')
        console.log(getheaders);
        return this.http.post(ep, {"path": s3Url, "servingid": modelId}, { headers: getheaders});
    }

    nbviewer(fileurl): Observable<any>{
      const headers = new HttpHeaders();
       headers.append('Accept', '*/*')
       headers.append('Content-Type', 'application/x-www-form-urlencoded')
       console.log(headers);
       let body = new URLSearchParams();
       body.set('gistnorurl', fileurl);
       const req = new HttpRequest('POST', 'https://nbviewer.jupyter.org/create/', body,
       {
         headers: headers
       });
       return this.http.request(req);
    }

    prepEndpoint(ep){
      if(!this.isDev){
        console.log("not dev");
        return ep;
      } else {
        console.log("is dev");
        console.log(ep);
        return 'http://368fc1c2.ngrok.io'+ ep;
      }
    }
}