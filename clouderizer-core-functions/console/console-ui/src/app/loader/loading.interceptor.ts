import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { LoadingScreenService } from "../services/loading-screen.service";
import { finalize } from "rxjs/operators";


@Injectable()
export class LoadingScreenInterceptor implements HttpInterceptor {

  activeRequests: number = 0;

  constructor(private loadingScreenService: LoadingScreenService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.activeRequests === 0) {
      console.log("loader started");
      this.loadingScreenService.startLoading();
    }

    this.activeRequests++;
    console.log("loader stopping");
    return next.handle(request).pipe(
      finalize(() => {
        this.activeRequests--;
        if (this.activeRequests === 0) {
          console.log("loader stopped");
          this.loadingScreenService.stopLoading();
        }
      })
    )
  };

}