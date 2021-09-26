import { Directive, Component, OnInit, ViewChild, Input, Output, EventEmitter, ElementRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../services/notify.service';
import {Subject, Observable} from 'rxjs';
import {WebcamImage, WebcamInitError, WebcamUtil} from 'ngx-webcam';

@Component({
  selector: 'capture-modal',
  templateUrl: './capture-modal.component.html',
  styleUrls: ['./capture-modal.component.scss']
})
export class CaptureModalComponent implements OnInit {

  @Output() emitData = new EventEmitter();

  closeModal(action) {
		this.activeModal.close(action);
  }

  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public router: Router,
    public notifyService: NotifyService
  ) { 
    // this.captures = [];
  }

  
  // @ViewChild("video", {static:false}) video: ElementRef;

  // @ViewChild("canvas", {static:false}) canvas: ElementRef;

  // public captures: Array<any>;

  // public ngOnInit() { }

  // public ngAfterViewInit() {
  //     if(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  //         navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
  //             this.video.nativeElement.src = window.URL.createObjectURL(stream);
  //             this.video.nativeElement.play();
  //         });
  //     }
  // }

  // public capture() {
  //     var context = this.canvas.nativeElement.getContext("2d").drawImage(this.video.nativeElement, 0, 0, 640, 480);
  //     this.captures.push(this.canvas.nativeElement.toDataURL("image/png"));
  // }

  public showWebcam = true;
  public allowCameraSwitch = true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  public videoOptions: MediaTrackConstraints = {
    // width: {ideal: 1024},
    // height: {ideal: 576}
  };
  public errors: WebcamInitError[] = [];

  // latest snapshot
  public webcamImage: WebcamImage = null;

  // webcam snapshot trigger
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean|string> = new Subject<boolean|string>();

  public ngOnInit(): void {
    WebcamUtil.getAvailableVideoInputs()
      .then((mediaDevices: MediaDeviceInfo[]) => {
        this.multipleWebcamsAvailable = mediaDevices && mediaDevices.length > 1;
      });
  }

  public triggerSnapshot(): void {
    this.trigger.next();
  }

  public toggleWebcam(): void {
    this.showWebcam = !this.showWebcam;
  }

  public handleInitError(error: WebcamInitError): void {
    this.errors.push(error);
  }

  public showNextWebcam(directionOrDeviceId: boolean|string): void {
    // true => move forward through devices
    // false => move backwards through devices
    // string => move to device with given deviceId
    this.nextWebcam.next(directionOrDeviceId);
  }

  public handleImage(webcamImage: WebcamImage): void {
    console.info('received webcam image', webcamImage);
    this.webcamImage = webcamImage;
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  public get nextWebcamObservable(): Observable<boolean|string> {
    return this.nextWebcam.asObservable();
  }

  // onFileChange(event) {
  //   const reader = new FileReader();
  //   console.log(event.target.result)
  //   if(event.target.files && event.target.files.length) {
  //     const [file] = event.target.files;
  //     reader.readAsDataURL(file);
    
  //     reader.onload = (e) => {
  //       console.log(e)
        
  //       console.log(reader)
  //       if(event.target.id == 'bgImage'){
  //         var img:any = new Image();
  //         img.src = reader.result;
  //         this.imageSrc = reader.result as string;
  //       }
  //     };
  //   }
  // }

  uploadimage(){
    this.emitData.emit({"src": this.webcamImage.imageAsDataUrl});
    // this.authService.httpService('api/customer/nbvariables', {"customerId": this.user.company.id, "type": "add", "key": this.notebookKey, "value": this.notebookValue}, 'post', (data) => {
    //   console.log(data);
    //   this.emitData.emit({"src": this.webcamImage.imageAsDataUrl});
    // }, (err) => {
    //   console.log(err);
    //   this.notifyService.notify('Something went wrong!', 'danger');
    // });
    this.closeModal(false);
  }
}
