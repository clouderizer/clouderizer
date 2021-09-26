import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs/Observable';

@Injectable()
export class GetServerlessUrl {
    constructor(
        private http:HttpClient,
        private router:Router,
        private authService: AuthService
      ) {
      }

    getServerlessUrl(): Observable<any>{
        let ep = this.authService.prepEndpoint("api/servingproject/getserverlessurl");
        let getheaders = new HttpHeaders().append('Content-Type','application/json');
        console.log(getheaders);
        return this.http.get(ep, { headers: getheaders});
    }
}