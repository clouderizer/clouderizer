import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable()
export class VersionCheckService {
   
    private currentHash: any;

    constructor(private http: HttpClient) {}

    public initVersionCheck(url, port, frequency = 1000 * 20) {
        setInterval(() => {
            this.checkVersion(url, port);
        }, frequency);
    }

    private checkVersion(url, port) {
        if(!localStorage.getItem(`scoringversion_${port}`)){
            localStorage.setItem(`scoringversion_${port}`, '{{POST_BUILD_ENTERS_HASH_HERE}}');  
        }
        this.currentHash = localStorage.getItem(`scoringversion_${port}`);
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
                    localStorage.setItem(`scoringversion_${port}`, hash);  
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