import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class VersionCheckService {
   
    private currentHash: any;

    constructor(private http: HttpClient) {}

    public initVersionCheck(url, frequency = 1000 * 60 * 30) {
        setInterval(() => {
            this.checkVersion(url);
        }, frequency);
    }

    private checkVersion(url) {
        if(!localStorage.getItem('version')){
            localStorage.setItem('version', '{{POST_BUILD_ENTERS_HASH_HERE}}');  
        }
        this.currentHash = localStorage.getItem('version');
        console.log(this.currentHash);
        this.http.get(url + '?t=' + new Date().getTime())
            .subscribe(
                (response: any) => {
                    const hash = response.hash;
                    console.log(hash)
                    const hashChanged = this.hasHashChanged(this.currentHash, hash);
                    if (hashChanged) {
                        window.location.reload();
                    }
                    this.currentHash = hash;
                    localStorage.setItem('version', hash);  
                },
                (err) => {
                    console.error(err, 'Could not get version');
                }
            );
    }

    private hasHashChanged(currentHash, newHash) {
        if (!currentHash || currentHash === '{{POST_BUILD_ENTERS_HASH_HERE}}') {
            return false;
        }
        return currentHash !== newHash;
    }
}