import { Component, OnInit, Input, Output, EventEmitter, HostListener, ViewChild, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { NotifyService } from '../../services/notify.service';
import { fileService } from '../../services/s3fileupload.service';

@Component({
  selector: 'app-bannerImage',
  templateUrl: './bannerImage.component.html',
  styleUrls: ['./bannerImage.component.scss']
})
export class bannerImage implements OnInit {

  @Input() projectModel;
  @Input() projectType;
  @Input() projectStatus;
  @Input() subtype;
  @Output() settingsOutput = new EventEmitter();

  bgimageSrc: any;
  bgimageExt: string;
  bgimageName: string;
  bgimageWidth: any;
  bgimageHeight: any;
  bgimageFile: any;
  uploading: boolean=false;
  uploadHideAndShow: boolean = false;
  preprocessEnabled: boolean;
  postprocessEnabled: boolean;
  retrainModel: boolean;
  retrainURL: string;
  timeSeries: boolean;
  user: any;

  closeModal(action) {
		this.activeModal.close(action);
  }
  
  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    private notifyService: NotifyService,
    private fileService: fileService
    ) {}


  ngOnInit() {
    this.user = this.authService.loggedInUser();
    this.preprocessEnabled = this.projectModel.preprocessEnabled;
    this.postprocessEnabled = this.projectModel.postprocessEnabled;
    this.retrainURL = this.projectModel.user_retrain_url;
    this.retrainModel = this.projectModel.enableRetrain;
    console.log(this.preprocessEnabled);
    this.timeSeries = this.projectModel.timeSeries;
    this.authService.httpService('api/servingmodel', this.projectModel.id, 'get', (value) => {
      if(value.bannerImage){
        this.bgimageWidth = value.bannerImage.width;
        this.bgimageHeight = value.bannerImage.height;
        this.bgimageName = value.bannerImage.name;
        this.bgimageExt = value.bannerImage.ext; 
      }
      if(this.bgimageName){
        this.fileService.getpresignedurls(this.bgimageName, "get").subscribe(res =>{
          console.log(res);
          this.bgimageSrc = res.urls[0];
        });
      }
      console.log(value); 
    },(err) => {
      console.log(err);
    }, false); 
  }

  uploadMessage(){  
    this.uploadHideAndShow=true;  
    setTimeout(() => {    
      this.uploadHideAndShow=false;  
    }, 3000);    
  }

  onFileChange(event) {
   
    const reader = new FileReader();
    console.log(event.target.result)
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = (e) => {
        console.log(e)
        
        console.log(reader)
        if(event.target.id == 'bgImage'){
          var img:any = new Image();
          img.src = reader.result;
          img.onload = () =>{
            this.bgimageWidth = img.width;
            this.bgimageHeight = img.height;
          }
          this.bgimageSrc = reader.result as string;
          this.bgimageName = event.target.files[0].name;
          this.bgimageFile = event.target.files[0];
          this.bgimageExt = event.target.files[0].name.split('.')[1]
        }
      };
    }
  }

  uploadClassImage(){
    this.uploading = true;
    var uploadImage = this.bgimageFile;
    var ctype = 'image/*;';
    const blob: Blob = new Blob([uploadImage], {type: ctype} );
    
    this.fileService.getpresignedurls(this.bgimageName, "put", ctype).subscribe(res =>{
      console.log(res); 
      if(res.success){
        const fileuploadurl = res.urls[0];
        this.fileService.uploadfileAWSS3(fileuploadurl, blob).subscribe(data => {
          console.log(data);
        }, err => {
          this.notifyService.notify(`File(s) upload failed: ${err}`, 'danger');
          console.log(err);
        },
        () => {
          this.uploading = false;
          this.uploadMessage();
          this.notifyService.notify('image uploaded successfully', 'success');
      });
      }
      else {
        this.notifyService.notify(res.msg, 'danger');
      }
    });
  }

  save(){
    this.projectModel.bannerImage = {ext: this.bgimageExt, name: this.bgimageName, width: this.bgimageWidth, height: this.bgimageHeight};
    this.projectModel.preprocessEnabled = this.preprocessEnabled;
    this.projectModel.postprocessEnabled = this.postprocessEnabled;
    this.projectModel.user_retrain_url= this.retrainURL;
    this.projectModel.enableRetrain= this.retrainModel;
    this.projectModel.timeSeries = this.timeSeries;

    this.authService.httpService('api/servingproject/bannerImage', {projectId: this.projectModel.servingproject, bannerImage: this.projectModel.bannerImage}, 'post', (value) => {
      console.log(value);
    },(err) => {
      this.notifyService.notify('Could not save banner image details', 'danger');
      console.log(err);
    });

    this.projectModel.savedon = (new Date().getTime() / 1000).toFixed()
    this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
      console.log(value);
      this.notifyService.notify('Settings updated successfully', 'success');
    },(err) => {
      console.log(err);
    });
    this.settingsOutput.emit({bannerImage: this.projectModel.bannerImage, timeSeries: this.timeSeries, retrainModel: this.retrainModel, preprocess: this.projectModel.preprocessEnabled, postprocess: this.projectModel.postprocessEnabled});
    this.closeModal(false);
  }
}