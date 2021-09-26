import {Component, OnInit, ViewChild} from '@angular/core';
import { MatStepper } from '@angular/material';
import {Subject} from 'rxjs/Subject';
import {Observable} from 'rxjs/Observable';
import {Router, ActivatedRoute, Params} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotifyService } from '../services/notify.service';
import {FormBuilder, FormGroup, Validators, ValidatorFn, ValidationErrors} from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActualOutputComponent } from '../actualOutput/actualOutput.component';
import { ModalPopupBrowseComponent } from '../modal-popup-browse/modal-popup-browse.component';
import { CaptureModalComponent } from '../capture-modal/capture-modal.component';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import {HttpRequest, HttpHeaders} from '@angular/common/http';
import { fileService } from '../services/fileupload.service';
import {Http, Headers} from '@angular/http';
import { NgxSpinnerService } from 'ngx-spinner';
import { sharedService } from '../services/shared.service';
import {invalidValueValidator} from './invalidValue.validator';
import {BrowserModule, DomSanitizer} from '@angular/platform-browser';
import { VersionCheckService } from '../services/versionCheck.service';
import { v4 as uuid } from 'uuid';
import * as RecordRTC from 'recordrtc';
import { environment } from 'src/environments/environment.prod';
//import mediumZoom from 'medium-zoom'
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexTitleSubtitle,
  ApexDataLabels,
  ApexFill,
  ApexMarkers,
  ApexYAxis,
  ApexXAxis,
  ApexTooltip,
  ApexTheme, 
  ApexLegend,
  ApexStroke,
  ApexAnnotations,
  ApexGrid
} from "ng-apexcharts";
import { CdkTreeModule } from '@angular/cdk/tree';

declare var $: any;
@Component({
  selector: 'app-servingmodel',
  templateUrl: './servingmodel.component.html',
  styleUrls: ['./servingmodel.component.scss']
})
export class ServingmodelComponent implements OnInit {

  public series: ApexAxisChartSeries;
  public chart: ApexChart;
  public legend: ApexLegend;
  public annotations: ApexAnnotations;
  public dataLabels: ApexDataLabels;
  public markers: ApexMarkers;
  public title: ApexTitleSubtitle;
  public fill: ApexFill;
  public yaxis: ApexYAxis;
  public xaxis: ApexXAxis;
  public tooltip: ApexTooltip;
  public theme: ApexTheme;
  public stroke: ApexStroke;
  public grid: ApexGrid;
  outputfiles: any[]=[];
  firstFormGroup: FormGroup;
  user:any;
  predictionFeedback: boolean;
  autoTicks = false;
  disabled = false;
  invert = false;
  projectName: string;
  projectDescription: string;
  max = 100;
  min = 0;
  showDetails: boolean;
  public:boolean=false;
  viewMore:boolean = false;
  noneimportant: boolean = false;
  objectKeys = Object.keys;
  like: any;
  dislike: any;
  outputError: boolean = false;
  showTicks = false;
  step = 1;
  loading:boolean=false;
  modelSubtype: string;
  predictionComplete: boolean=false;
  bannerImageSrc: string;
  actualOutput: any[]=[];
  thumbLabel = true;
  value = 0;
  csvfiles:any[] = [];
  headersRow:any[]=[];
  dataRecords:any[]=[];
  outRecords:any[]=[];
  uploadcsv:boolean=false;
  vertical = false;
  outputsample:any[]=[];
  outputs:any[]=[];
  inputList: any[]=[];
  importantList:any[]=[];
  outputList: any[]=[];
  outputValue: string;
  max_output: any[]=[];
  outputProb: any[]=[];
  buttonClick: boolean = false;
  servingmodelId: string;
  port: string;
  // isZoomedinput: boolean=false;
  // isZoomeddai: boolean=false;
  // isZoomednormal: boolean=false;
  // isZoomednormal2: boolean=false;
  feedback: string;
  inputHistory: any[]=[];
  outputHistory: any;
  modelHistory: any;
  modelHistoryArray: any[]=[];
  servingHistory: any;
  servingHistoryArray: any[]=[];
  responseTime: any;
  outputResult: any[]=[];
  blob:any;
  validForm: boolean=false;
  requestid: any;
  timeseriesdata: any[]=[];
  lowerbound: any;
  upperbound: any;
  timeSeries: boolean;
  colors: any;
  resampled: boolean;
  actual: any;
  multerPass: boolean;
  inimageclicked: boolean;
  outimageclicked: boolean;
  //Lets declare Record OBJ
  record;
  //Will use this flag for toggeling recording
  recording = false;
  //URL of Blob
  url;
  error;

  @ViewChild('stepper', { static: true }) stepper: MatStepper;
  public tabItem = 1;

  constructor(
    public modalService: NgbModal,
    private domSanitizer: DomSanitizer,
    private _formBuilder: FormBuilder,
    private activatedRoute: ActivatedRoute,
    public authService: AuthService,
    private fileService: fileService,
    private notifyService: NotifyService,
    private http: Http,
    public spinner: NgxSpinnerService,
    private dataService: sharedService,
    private sanitizer: DomSanitizer,
    private versionCheckService: VersionCheckService
  ) {
    this.initChartData();
  }

  public initChartData(): void {
    this.series = [
      {
        name: "output",
        data: []
      },
      {
        name: 'lower bound',
        data: []
      },
      {
        name: 'upper bound',
        data: []
      },
      {
        name: 'Real data',
        data: []
      },
    ];

    this.stroke = {
      show: true,
      width: 2,
      curve: 'smooth',
      dashArray: [0, 0, 0, 0],
      // curve : ['smooth', 'smooth', 'smooth', 'straight']
    }

    this.legend = {
      show: true,
      position: 'bottom',
      itemMargin: {
        horizontal: 5,
        vertical: 10
      }
    }

    // this.annotations = {
    //   yaxis: []
    // }

    this.chart = {
      type: "line",
      stacked: false,
      height: 200,
      zoom: {
        type: "x",
        enabled: true,
        autoScaleYaxis: true
      },
      toolbar: {
        autoSelected: "zoom"
      }
    };

    this.theme = {
      palette: 'palette5'
    };

    this.dataLabels = {
      enabled: false
    };

    this.markers = {
      size: 0,
      hover: {
        sizeOffset: 5
      }
    };

    this.title = {
      text: undefined,
      align: "left"
    };

    this.yaxis = {
      title: {
        text: "output"
      },
      tickAmount: 6,
      labels: {
        "formatter": function (val) {
            return val.toFixed(0)
        }
      }
    };

    this.xaxis = {
      type: "datetime",
      labels: {
        show:true,
        datetimeFormatter: {
          year: 'yyyy',
          month: "MMM 'yy",
          day: 'dd MMM',
          hour: 'HH:mm',
      },
      }
    };

    this.tooltip = {
      shared: true,
      x: {
        show: true,
        format: 'dd MMM yy HH:mm:ss',
        formatter: undefined,
      },
      y: <any>{
        formatter: function(value, { series, seriesIndex, dataPointIndex, w }) {
          return value
        }
      }
    };

    this.grid = {
      borderColor: "#f1f1f1"
    };

    this.colors = ['#4272d7', '#90EE90', '#73b369', '#FFA500'];
  }

  chartOptions = {
    scales: {
      xAxes: [{
        stacked: true,
        ticks: {
          fontColor: 'lightblue',  // x axis labels (can be hexadecimal too)
        },
      }],
      yAxes: [{
        stacked: true,
        ticks: {
          fontColor: 'lightblue',  // x axis labels (can be hexadecimal too)
        },
      }],
    }
  };

  movetostep(index: number) {
    this.stepper.selectedIndex = index;
  }

  // toggle webcam on/off
  public showWebcam = true;
  postprocessEnabled: boolean;
  preprocessEnabled: boolean;
  something: any={};
  some:any={};
  projectId: any;
  servingid: any;
  companyId: any;
  infratype:string;
  public allowCameraSwitch = true;
  public nextWebcamObservable=true;
  public tickInterval=true;
  public always=true;
  public multipleWebcamsAvailable = false;
  public deviceId: string;
  istrial: boolean;
  plan: string;
  bannerImage: any;
  public videoOptions: MediaTrackConstraints = {
  };
  private trigger: Subject<void> = new Subject<void>();
  // switch to next / previous / specific webcam; true/false: forward/backwards, string: deviceId
  private nextWebcam: Subject<boolean|string> = new Subject<boolean|string>();

  public ngOnInit(): void {
    //mediumZoom(document.getElementById('zoomDefault'))
    this.firstFormGroup = this._formBuilder.group({
      input0: ['', [Validators.required]]
    });

    $(document).ready(function () {
      $("#menu").click();
    });

    this.activatedRoute.params.subscribe(params => {
      console.log(params);
      this.servingmodelId = params['id'];

      const projectdetailsurl = 'function/' + this.servingmodelId + '/projectdetails';
      this.authService.httpService(projectdetailsurl, null, 'get', (result) => {
          console.log(result);
          if(result.bannerImage){
            try{
              this.bannerImage = eval(result.bannerImage);
            }
            catch(err){
              this.bannerImage = result.bannerImage;
            }
          }
          this.modelSubtype = result.subtype;
          this.servingid = result.servingid;
          this.projectId = result.projectid;
          this.companyId = result.companyId;
          this.projectName = result.projectName;
          this.projectDescription = result.projectDescription == 'null' ? '' : result.projectDescription;
          this.timeSeries = result.timeSeries;
          this.public = result.public;
          this.preprocessEnabled = result.preprocess;
          this.postprocessEnabled = result.postprocess;

          this.dataService.send({projectName: this.projectName, projectId:this.projectId, public: this.public});
          if(result.input){
            console.log(result.input)
            try{
              var input  = eval(result.input);
            }
            catch(err){
              var input = result.input
            }
            
            console.log(input)
            if(this.preprocessEnabled){
              this.inputList = input[0].rawinputList;
            }
            else{
              console.log(this.inputList)
              this.inputList = input[0].inputList;
            }
          }
          if(result.output){
            try{
            var output = eval(result.output);
            }
            catch(err){
              var output = result.output;
            }            
            if(this.postprocessEnabled){
              this.outputList = output[0].finaloutput;
            }
            else{
              this.outputList = output[0].outputList;
            }
          }

          console.log(this.outputList);
          console.log(this.inputList);

          if(this.inputList.filter(item => item.important == true).length == 0){
            this.viewMore = true;
            this.noneimportant = true;
          }

          if(this.bannerImage){
            console.log(this.bannerImage);
            this.fileService.getpresignedurls(this.bannerImage.name, this.companyId, "get").subscribe(res =>{
              console.log(res);
              if(!res.success){
                console.log("couldn't get url")
              }
              else{
                this.bannerImageSrc = res.urls[0];
              }
            });
          }
          else{
            this.bannerImageSrc = "";
          }

          //Get account license info from here
          // this.authService.httpService('api/getlicenseinfo', this.companyId, 'get', (result) => {
          //   this.istrial = result.istrial;
          //   this.plan = result.plan;
          // }, (err) => {
          //   console.log(err);
          // });

          if(this.modelSubtype === 'h2o' || this.modelSubtype === 'jpmml' || this.modelSubtype === 'pmml4s' || this.modelSubtype === 'pythonscore'){
            for (let i=0; i<this.inputList.length; i++){  
              if(this.inputList[i].allowedValues.length > 0 && this.inputList[i].type == 'Enum'){
                this.inputList[i].selected = this.inputList[i].allowedValues[0];
              }
              else if(this.inputList[i].min && this.inputList[i].max){
                this.inputList[i].selected = this.inputList[i].min;
              }
              else if(['Multiline Text', 'Text', 'Enum'].includes(this.inputList[i].type)){
                this.inputList[i].selected = "sample text";
              }
              else if(['Integer', 'Whole', 'None'].includes(this.inputList[i].type)){
                this.inputList[i].selected = 0;
              }
              
              if(this.inputList[i].min === null && this.inputList[i].max === null){
                this.something['input' + i] = ['', [Validators.required]]
              }
              else {
              this.something['input' + i] = ['', [Validators.required, Validators.max(this.inputList[i].max), Validators.min(this.inputList[i].min)]]
              }           
            }
          }
          else if(this.modelSubtype === 'dai'){
            for (let i=0; i<this.inputList.length; i++){
              if(this.inputList[i].allowedValues.length > 0 && this.inputList[i].type == 'Enum'){
                this.inputList[i].selected = this.inputList[i].allowedValues[0];
              }
              else if(this.inputList[i].min && this.inputList[i].max){
                this.inputList[i].selected = this.inputList[i].min;
              }
              else if(['Multiline Text', 'Text', 'Enum', 'None'].includes(this.inputList[i].type)){
                this.inputList[i].selected = "";
              }
              else if(['Integer', 'Whole', 'None'].includes(this.inputList[i].type)){
                this.inputList[i].selected = 0;
              }
              
              if(this.inputList[i].min === null && this.inputList[i].max === null){
                this.something['input' + i] = ['']
              }
              else {
              this.something['input' + i] = ['', [Validators.max(this.inputList[i].max), Validators.min(this.inputList[i].min)]]
              }
            }
          }
          
          this.firstFormGroup = this._formBuilder.group(
            this.something
          );
          

      }, err => {
        console.log(err);
        this.notifyService.notify('Something went wrong while fetching project details', 'danger');
      });
    });
    //const zoomDefault = mediumZoom('#zoom-default');
    // const zoom = mediumZoom();
    // zoom.attach(document.querySelector('#zoom-default'));

    // const zoomPaper = mediumZoom('.container img', {
    //   background: 'rgba(247, 249, 250, 0.97)',
    //   margin: 16,
    //   template: '#template-dropbox-paper',
    //   container: '[data-zoom-container]',
    // })
    
    // You can start manipulating the DOM after the `opened` event has been triggered
    // zoomPaper.on('opened', () => {
    //   const closeButton = document.querySelector('[data-zoom-close]')
    //   closeButton.addEventListener('click', () => zoomPaper.close())
    // })
    
    // // Block scroll on zoom
    // zoomPaper.on('open', () => {
    //   document.body.style.overflow = 'hidden'
    // })
    // zoomPaper.on('close', () => {
    //   document.body.style.overflow = ''
    // })

  }

  public triggerSnapshot(): void {
    this.trigger.next();
    
  }

  sanitize(url: string) {
    return this.domSanitizer.bypassSecurityTrustUrl(url);
  }

  initiateRecording(input) {
    input.recording = true;
    input.url = "";
    let mediaConstraints = {
      video: false,
      audio: true
    };
    navigator.mediaDevices.getUserMedia(mediaConstraints).then((stream) =>{
      var options = {
        mimeType: "audio/wav",
        numberOfAudioChannels: 1,
        sampleRate: 16000,
      };
      var StereoAudioRecorder = RecordRTC.StereoAudioRecorder;
      input.record = new StereoAudioRecorder(stream, options);
      input.record.record();
    }, (err) => {
      this.notifyService.notify('Cannot play audio in your browser', 'danger');
      this.error = 'Can not play audio in your browser';
    });
  }

  stopRecording(input) {
    input.recording = false;
    input.record.stop((blob) => {
      input.url = URL.createObjectURL(blob);
    });
  }

  buttonClicked(){
    this.buttonClick = !this.buttonClick;
  }

  public webCam(): void {    
    this.showWebcam = true;
  }

  public showNextWebcam(directionOrDeviceId: boolean|string): void {
    this.nextWebcam.next(directionOrDeviceId);
  }

  public cameraWasSwitched(deviceId: string): void {
    console.log('active device: ' + deviceId);
    this.deviceId = deviceId;
  }

  public get triggerObservable(): Observable<void> {
    return this.trigger.asObservable();
  }

  ViewMore(){
    this.viewMore = !this.viewMore;
  }

  capture(input){
    var actionModel = this.modalService.open(CaptureModalComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "aboutPop" });
    actionModel.componentInstance.emitData.subscribe(data => {
      input.imageSrc = data.src;
    })
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  isClicked(event, type){

    // if(id == 'inputimage'){
    //   this.isZoomedinput = !this.isZoomedinput
    // }
    // else if(id == 'outputnormal'){
    //   this.isZoomednormal = !this.isZoomednormal
    // }
    // else if(id == 'outputnormal2'){
    //   this.isZoomednormal2 = !this.isZoomednormal2
    // }
    // else if(id == 'outputdai'){
    //   this.isZoomeddai = !this.isZoomeddai
    // }
    var target = event.target || event.srcElement || event.currentTarget;
    var idAttr = target.attributes.id;
    console.log("attr id", idAttr.nodeValue);
    if(document.getElementById(idAttr.nodeValue).classList.contains("zoomin")){
      if(type == 'in'){
        this.inimageclicked = false;
      }
      else if(type == 'out'){
        this.outimageclicked = false;
      }
      document.getElementById(idAttr.nodeValue).classList.add("zoomout");
      document.getElementById(idAttr.nodeValue).classList.remove("zoomin");
    }
    else{
      if(type == 'in'){
        this.inimageclicked = true;
      }
      else if(type == 'out'){
        this.outimageclicked = true;
      }
      document.getElementById(idAttr.nodeValue).classList.add("zoomin");
      document.getElementById(idAttr.nodeValue).classList.remove("zoomout");
    }
  }

  changeFeedback(text){
    if(text == 'like'){
      this.predictionFeedback = true;
      var imageEmotion = 'happy';
    }
    else if(text == 'dislike'){
      this.predictionFeedback = false;
      var imageEmotion = 'unhappy';
    }
    this.authService.httpService('api/servinghistory?requestid='+this.requestid, null, 'get', (data) => {
      console.log(data);
      this.servingHistory = data;
      this.servingHistory.feedback = this.predictionFeedback;
      this.authService.httpService('api/servinghistory', this.servingHistory, 'put', (data) => {
        if(this.timeSeries) this.notifyService.notify('Feedback saved', 'success');
        var thumbs_up = 0;
        var thumbs_down = 0;
        // --------------------------------------------------------
        this.authService.httpService('api/servinghistory?model='+this.servingid, null, 'get', (val) => {
          thumbs_up = val.filter(item => item.feedback === true).length
          thumbs_down = val.filter(item => item.feedback === false).length
  
          this.authService.httpService('api/servingproject/feedback', {projectId: this.projectId, thumbs_up: thumbs_up, thumbs_down: thumbs_down}, 'post', (data) => {
            console.log('project details updated successfully');
          }, err => {
            this.notifyService.notify('Something went wrong while saving details', 'danger');
          }, false);
        }, (err) =>{
          console.log(err)
        }, false);
  
      }, err => {
        this.notifyService.notify('Something went wrong while saving details', 'danger');
      }, false);
      this.servingHistory = data;
    }, err => {
      this.notifyService.notify('Something went wrong while saving model details', 'danger');
    }, false);

    console.log(this.timeSeries);
    if(!this.timeSeries){
      var actionModel = this.modalService.open(ActualOutputComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" }); 
      actionModel.componentInstance.outputList = this.outputList;
      actionModel.componentInstance.imageEmotion = imageEmotion;
      actionModel.componentInstance.timeSeries = this.timeSeries;
      actionModel.componentInstance.actualoutputEvent.subscribe(data => {
        if(data.save){
          if(this.outputList && this.outputList.length > 0 ){
            this.servingHistory.actualOutput = [];
            this.outputList.forEach(item => {
              this.servingHistory.actualOutput.push({name: item.userfriendlyName || item.name, value: item.actualOutput})
            });
            this.authService.httpService('api/servinghistory', this.servingHistory, 'put', (data) => {
              this.notifyService.notify('Feedback saved', 'success');
              this.authService.httpService('api/servinghistory?model='+this.servingid, null, 'get', (val) => {
                console.log(val);
                var errorMetric = [];
                if(this.outputList[0].allowedValues && this.outputList[0].allowedValues.length > 0){
                  this.outputList[0].allowedValues.forEach(item => {
                    var predictTotal = val.filter(i => { if(i.output[0] && i.actualOutput){return i.output[0].value == item}}).length;
                    var actualTotal = val.filter(i => { if(i.output[0] && i.actualOutput){return i.actualOutput[0].value == item}}).length;
                    var predictItem = val.filter(i => { if(i.output[0] && i.actualOutput){return i.output[0].value == item && item == i.actualOutput[0].value}}).length;
                    var precision = (predictItem/predictTotal);
                    var recall = (predictItem/actualTotal);
                    var f1score = (2 * ((precision * recall)/(precision + recall))); 
                    errorMetric.push({name: item, precision: precision.toFixed(2), recall: recall.toFixed(2), f1score: f1score.toFixed(2)});
                  })
                }
                this.authService.httpService('api/servingmodel/updateErrorMetric', {modelId: this.servingHistory.model, errorMetric: errorMetric}, 'post', (data) => {
                  console.log('ErrorMetric details updated successfully');
                }, err => {
                }, false);
              }, (err) =>{
                console.log(err)
              }, false);
            }, err => {
              this.notifyService.notify('Something went wrong while saving model details', 'danger');
            });
          }
          else{
            this.servingHistory.actualOutput = [];
            this.servingHistory.actualOutput.push({name: 'Result', value: data.data})  
            this.authService.httpService('api/servinghistory', this.servingHistory, 'put', (data) => {
              this.notifyService.notify('Feedback saved', 'success');
              this.authService.httpService('api/servinghistory?model='+this.servingid, null, 'get', (val) => {
                console.log(val);
                var errorMetric = [];
                if(this.outputList[0].allowedValues && this.outputList[0].allowedValues.length > 0){
                  this.outputList[0].allowedValues.forEach(item => {
                    var predictTotal = val.filter(i => { if(i.output[0] && i.actualOutput){return i.output[0].value == item}}).length;
                    var actualTotal = val.filter(i => { if(i.output[0] && i.actualOutput){return i.actualOutput[0].value == item}}).length;
                    var predictItem = val.filter(i => { if(i.output[0] && i.actualOutput){return i.output[0].value == item && item == i.actualOutput[0].value}}).length;
                    console.log(predictItem);
                    console.log(predictTotal);
                    console.log(actualTotal);
                    var precision = (predictItem/predictTotal);
                    var recall = (predictItem/actualTotal);
                    var f1score = (2 * ((precision * recall)/(precision + recall))); 
                    errorMetric.push({name: item, precision: precision.toFixed(2), recall: recall.toFixed(2), f1score: f1score.toFixed(2)});
                  })
                }
                this.authService.httpService('api/servingmodel/updateErrorMetric', {modelId: this.servingHistory.model, errorMetric: errorMetric}, 'post', (data) => {
                  console.log('ErrorMetric details updated successfully');
                }, err => {
                }, false);
              }, (err) =>{
                console.log(err)
              }, false);
            }, err => {
              this.notifyService.notify('Something went wrong while saving model details', 'danger');
            });
          }
        }
      });

      actionModel.result.then((result) => {
      }, (reason) => {
      });
    }  
  }

  async predict(){
    this.spinner.show('prediction');
    console.log("single line prediction");
    console.log(this.inputList);
    var userInput = [];
    this.inputHistory = [];
    this.outputHistory = [];
    this.outputsample = [];
    this.feedback = null;
    
    // loop thru userinputs
    this.requestid = uuid();
    let formData = new FormData(); 
    for(let i=0;i<this.inputList.length; i++){
      if(typeof(this.inputList[i].selected) === 'string'){
        this.inputList[i].selected.replace(',', '#$#$')
      }
      if(this.inputList[i].type === 'Image'){
        this.multerPass = true;
        const base64Response = await fetch(`${this.inputList[i].imageSrc}`);
        const uploadImage = await base64Response.blob();
        const blob: Blob = new Blob([uploadImage], {type: 'image/*;'} );
        console.log("blob",blob)
        formData.append(`${this.inputList[i].name}`, blob, `${this.inputList[i].name}_${this.requestid}.png`); 
      }
      else if(this.inputList[i].type === 'Audio'){
        this.multerPass = true;
        const base64Response = await fetch(`${this.inputList[i].url}`);
        const uploadAudio = await base64Response.blob();
        const blob: Blob = new Blob([uploadAudio], {type: 'audio/*;'});
        console.log("blob",blob)
        formData.append(`${this.inputList[i].name}`, blob, `${this.inputList[i].name}_${this.requestid}.wav`); 
      }
      else{
        userInput.push(this.inputList[i].selected);
        formData.append(this.inputList[i].name, this.inputList[i].selected);
      }
      this.inputHistory.push({name: this.inputList[i].userfriendlyName || this.inputList[i].name, value:this.inputList[i].selected});
    }

    var body:any;
    var userInputstr = userInput.toString();
    console.log(userInput);
    console.log("before stringify")
    console.log(JSON.stringify(userInputstr));

    if(this.multerPass){
      formData.append("requestid", this.requestid);
      //formData.append("frombrowser", "true");  //frombrowser extra
      body = formData;
      // headers = [{'Content-Type': 'multipart/form-data'}];
    }
    else{
      body = {"csv": userInputstr, "requestid": this.requestid, "frombrowser": "true"};  //frombrowser
      // headers = null;
    }

    if(this.modelSubtype === 'dai'){
      if(userInput.length === userInput.filter(item =>item == undefined).length){
        this.notifyService.notify('Please enter atleast one input', 'danger');
        this.spinner.hide('prediction');
        return
      }
    }

    let headers = new Headers();
    headers.append('X-browser','yes');  //frombrowser commented
    const url = this.servingmodelId + '/predict';
    this.http.post(url, body, {headers: headers}).map(res => res.json()).subscribe((data) => {
      this.handlepredictionres(data);
    }, (err) => {
      this.handlepredictionerr(err);
    })
  }

  handlepredictionres(data){
    this.tabItem = 2;
    this.authService.httpService('api/servinghistory/intercomscoring', {"scoring": true, "pprojectname": this.servingmodelId }, 'post', (val) => {  
    }, (err) =>{
      console.log(err)
    }, false, false);
    console.log(data);
    this.spinner.hide('prediction');
    this.loading = true;
    if(data.responseTime){
      this.responseTime = data.responseTime;
    }
    else{
      this.responseTime = 28;
    }
    if(data.datafiles && data.datafiles.length > 0){
      this.outputfiles = data.datafiles;
      for(let i=0;i<this.outputfiles.length; i++){
        this.getpresignedurl(this.outputfiles[i].path, (data, err) => {
          if(!err && data) this.outputfiles[i].src = data;
          else this.outputfiles[i].src = "";
        })
      }
    }
    this.predictionComplete = true;
    this.outputHistory = this.outputFormat(data.data[0]);
    var dateFormat = Number(new Date());    
    this.modelHistory = {company: this.companyId, responseTime: this.responseTime, feedback: true, timestamp: new Date(dateFormat), model: this.servingid, input: this.inputHistory, output: this.outputHistory}
  }

  handlepredictionerr(err){
    this.tabItem = 2;
    this.authService.httpService('api/servinghistory/intercomscoring', {"scoring": false, "pprojectname": this.servingmodelId }, 'post', (val) => {  
    }, (err) =>{
      console.log(err)
    }, false);
    this.spinner.hide('prediction');
    console.log(err._body);
    console.log(this.outputList)
    if(!this.outputList || this.outputList.length == 0 ){
      this.outputList = [];
      this.outputList.push({name: 'Result', userfriendlyName: 'Result', outputValue: 'Error'});
    }
    else{
      this.outputList.forEach(output => {
        output.outputValue = 'Error';
        output.src = '';
      });
    }

    if(err._body.stack_trace){
      var stackTrace =  err._body.stack_trace;
    }
    else{
      var stackTrace =  err._body["message"];
    }

    var predictionResult = 'Failed';
    this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
    console.log(err);
    var dateFormat = Number(new Date());   
    this.modelHistory = {company: this.companyId, responseTime: undefined, feedback: undefined, timestamp: new Date(dateFormat), model: this.servingid, input: this.inputHistory, output: this.outputHistory};
  }

  getpresignedurl(item, cb){
    this.fileService.getpresignedurls(item, this.companyId, "get").subscribe(res =>{
      console.log(res.urls[0]);
      return cb(res.urls[0], null);
    }, err => {
      return cb(null, err)
    });
  }

  changeFill(event){
    if(event.target.id === 'like'){
      console.log("like");
      this.like = document.getElementById('like');
      this.like.classList.toggle('green');
      this.dislike = document.getElementById('dislike');
      this.dislike.classList.toggle('grey')
    }

    else if(event.target.id === 'dislike'){
      console.log("dislike");
      this.dislike = document.getElementById('dislike');
      this.dislike.classList.toggle('green');
      this.like = document.getElementById('like');
      this.like.classList.toggle('grey');
    }
  }

  encode(data){
    var str = data.reduce(function(a,b){ return a+String.fromCharCode(b) },'');
    return btoa(str).replace(/.{76}(?=.)/g,'$&\n');
  } 

  outputFormat(data){
    this.outputsample = [];
    this.outputHistory = [];
    if(this.timeSeries){
      data = data.data;  
      this.outputList.push({userfriendlyName: 'Result', outputValue: JSON.stringify(data)});
      if(Array.isArray(data) && Array.isArray(data[0])){
        this.timeseriesdata = data.map(item => [item[0] = Number(new Date(item[0])), item[1]]);
        var lowername = "";
        var uppername = "";
        var output = this.outputList.find(x => x.name == 'yaxis(output)')["userfriendlyName"];
        this.series = [{name: 'Predicted output', data: this.timeseriesdata}];
        console.log("bound check")

        if(this.outputList.find(x => x.name == 'lower bound' && x.include == true)){
          console.log("lower bound check")
          lowername = this.outputList.find(x => x.name == 'lower bound')["userfriendlyName"];
          this.lowerbound = data.map(item => [item[0] = Number(new Date(item[0])), item[2]]);
          if(this.lowerbound.filter(item => item[1] !== undefined).length > 0){
            console.log("lower bound present")
            this.series.push({name: lowername, data: this.lowerbound});
          }
        }
        if(this.outputList.find(x => x.name == 'upper bound' && x.include == true)){
          console.log("upper bound check")
          uppername = this.outputList.find(x => x.name == 'upper bound')["userfriendlyName"];
          this.upperbound = data.map(item => [item[0] = Number(new Date(item[0])), item[3]]);
          if(this.upperbound.filter(item => item[1] !== undefined).length > 0){
            console.log("upper bound present")
            this.series.push({name: uppername, data: this.upperbound});
          }
        }

        if(!this.resampled && this.actual && this.actualOutput.length == 0){
          var csvrecord = {"date1":[], "output1":[]};
          for(let i=0; i<2; i++){
            csvrecord["date1"].push(Number(new Date(data[i][0]))) // /1000
            csvrecord["output1"].push(Number(data[i][1])) 
          };
          console.log(csvrecord)
          var value = {};
          value["predicted"] = csvrecord;
          value["actualOutput"] = this.actual;
          value["id"] = this.servingid; //change here
          console.log(value);
          this.authService.httpService('api/servingmodel/updateactual', value, 'post', (data) => {
            console.log(data);
            this.resampled = true;
            for(let i=0; i<Object.keys(data.data).length; i++){
              this.actualOutput.push([Number(new Date(Number(Object.keys(data.data)[i]))), Number(Object.values(data.data)[i])]);
            };
            this.series.push({name: "Real data", data: this.actualOutput});
          }, err => {
          },false);
        }
        else if(this.resampled && this.actual && this.actualOutput.length == 0){
          for(let i=0; i<Object.keys(this.actual).length; i++){
            this.actualOutput.push([Number(new Date(Number(Object.keys(this.actual).sort()[i]))), Number(this.actual[Object.keys(this.actual).sort()[i]])]);
          }
          console.log(this.actualOutput);
          this.series.push({name: "Real data", data: this.actualOutput});
        }
        // else{
        //   this.actualOutput = undefined;
        // }
        else if(this.actual && this.actualOutput.length > 0){
          this.series.push({name: "Real data", data: this.actualOutput});
        }
        this.yaxis = {
          title: {
            text: output
          },
          tickAmount: 6,
          labels: {
            "formatter": function (val) {
                return val.toFixed(0)
            }
          }
        };

        if(this.actualOutput){
          var c = 0;
          var d = 0;
          for(let i=0; i<this.timeseriesdata.length; i++){
            for(let j=0; j<this.actualOutput.length; j++){
              if(this.timeseriesdata[i][0] === this.actualOutput[j][0]){
                c += (Math.pow(this.timeseriesdata[i][1] - this.actualOutput[j][1], 2))
                d +=1
                break;
              }
              else{
                continue;
              }
            }
          }
  
          var errorData = {"errordata": [c,d], "modelId": this.servingid}; //change here
          this.authService.httpService('api/servingmodel/updateError', errorData, 'post', (data) => {
            console.log(data);
          }, err => {
          },false);
          // var calculate = true;
          // (async function() {
            // while(calculate)
          var checkOutput = setInterval(()=>{
            this.authService.httpService('api/servinghistory/errorCalculated?requestid='+this.requestid, {"errorCalculated": true}, 'post', (data) => {
              if(data && data.length > 0){
                clearInterval(checkOutput); 
              }
            }, err => {
              this.notifyService.notify('Something went wrong while saving model details', 'danger');
              clearInterval(checkOutput); 
            }, false);
          }, 3000);        
        }
        for(let i=0; i<this.timeseriesdata.length; i++){
          this.outputHistory.push({timestamp: this.timeseriesdata[i][0], predicted: this.timeseriesdata[i][1]});
        }
      } 
    }
    else if(this.modelSubtype === 'dai'){
      if(this.postprocessEnabled){
        if(data){
          this.outputList.forEach(output => {
            storeValues = [];
            output.predictionResult = 'Success';
            if(data.output){
              output.outputValue = data.output;
            }
            else{
              output.outputValue = data;
            }
            if(data.classprobabilities) {
              this.showDetails = true;
              data.classprobabilities.forEach(element => {
                this.outputsample.push(parseFloat(element));
              })
        
              var storeValues = [];
              output.allowedValues.forEach((i, j) => {storeValues.push({value: i, prob: (parseFloat(this.outputsample[j])*100).toFixed(2)})})
              var reversestoreValues = storeValues.sort(function(a,b){ return a.prob - b.prob});
              storeValues = storeValues.sort(function(a,b){ return b.prob - a.prob});
              
              console.log(reversestoreValues);
              console.log(storeValues);
              output.outputProb = [{name: output.name, values: storeValues}];
              console.log(output.outputProb);
            }

            if(output.enums){
              output.enums.every(item => {
                console.log(item);
                console.log(output.outputValue);
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false;
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];
                      return false;           
                    });
                  }
                }
                else{
                  output.src = "";
                  return true;
                }
              })
            }
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          })
        }
        else{
          this.outputList.forEach(output => {
            output.outputValue = 'null';
            output.predictionResult = 'Success';
            if(output.enums){
              output.enums.every(item => {
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];
                      return false;              
                    });
                  } 
                }
                else{
                  output.src = "";
                  return true; 
                }
              })
            } 
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          })
        }
      }
      else if(data.success && data.output){
        console.log('its an array');
        data.output.forEach(element => {
          this.outputsample.push(parseFloat(element));
        }); 
        this.outputList.forEach((i, j) => {
          i.predictionResult = 'Success';
          i.outputValue = this.outputsample[j];    ///need changes here
          if(i.enums){
            i.enums.every(item => {
              if(item.name == i.outputValue && item.fileName){
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  i.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false; 
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    i.src = res.urls[0];  
                    return false;           
                  });
                } 
                i.text = item.text;
              }
              else{
                i.src = "";
                return true;
              }
            })
          }
          this.outputHistory.push({name: i.userfriendlyName || i.name, value: i.outputValue, predictionResult: i.predictionResult});
        });
      }
      else if(data.success && !data.output){
        this.outputList.forEach((i, j) => {
          i.predictionResult = 'Success';
          i.outputValue = 'null';
          if(i.enums){
            i.enums.every(item => {
              if(item.name == i.outputValue && item.fileName){
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  i.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false; 
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    i.src = res.urls[0];  
                    return false;           
                  });
                } 
                i.text = item.text;
              }
              else{
                i.src = "";
                return true;
              }
            })
          }
          this.outputHistory.push({name: i.userfriendlyName || i.name, value: i.outputValue, predictionResult: i.predictionResult});
        });
      }
      else{
        this.outputList.forEach(i => {
          i.outputValue = 'Error';
          i.src = "";
        });
        if(data.message == 'No response from model predictor'){
          var stackTrace =  data.stack_trace;
        }
        else{
          var stackTrace =  data.message;
        }
        var predictionResult = 'Failed';
        this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
      }
    }
    else if(this.modelSubtype === 'pythonscore'){
      if(data.message){
        if(data.message == 'No response from model predictor'){
          var stackTrace =  data.stack_trace;
        }
        else{
          var stackTrace =  data.message;
        }
        var predictionResult = 'Failed';
        this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
      }
      else if(!this.outputList || this.outputList.length == 0){
          this.outputList = [];
          this.outputList.push({userfriendlyName: 'Result', outputValue: JSON.stringify(data.data)});
          this.outputHistory.push({name: 'Result', value: JSON.stringify(data.data)});
      }
      else{
          for(let i=0; i<this.outputList.length; i++){
            this.outputList[i].outputValue = '';
            try{
              if(typeof(data.data) === 'string'){
                console.log("string");
                data.data = eval(data.data);
              }
              if(data.data[0] && this.outputList[i].name in data.data[0].data){
                console.log("getting outputvalue");
                this.outputList[i].outputValue = data.data[0].data[this.outputList[i].name];

                if(data.data[0]["classprobabilities"] && data.data[0]["classprobabilities"].length > 0){
                  var storeValues = [];
                  data.data[0]["classprobabilities"].forEach(i => {
                    storeValues.push({value: i.name, prob: (parseFloat(i.probability)*100).toFixed(2)})
                  })
                  if(storeValues){
                    storeValues = storeValues.sort(function(a,b){ return b.prob - a.prob});
                  }
                  this.outputList[i].outputProb = [{name: this.outputList[i].name, values: storeValues}]
                }

                console.log(this.outputList[i].enums);
                if(this.outputList[i].enums){
                  this.outputList[i].enums.every(thing => {
                    if(thing.name == this.outputList[i].outputValue){
                      this.outputList[i].text = thing.text;
                      if(thing.fileName.substring(0,17) == 'clouderizerImage_'){
                        this.outputList[i].src = `${environment.baseurl}/userserving/assets/images/outputServing/${thing.fileName}`;
                        return false; 
                      }
                      else{
                        this.fileService.getpresignedurls(thing.fileName, this.companyId, "get").subscribe(res =>{
                          console.log(res);
                          this.outputList[i].src = res.urls[0];   
                          return false;           
                        });
                      }
                    }
                    else{
                      this.outputList[i].src = "";
                      return true; 
                    }
                  })
                }
              }
 
              if(!this.outputList[i].outputValue){
                if(this.outputList[i].type != 'Image'){
                  console.log("no outputValue");
                  this.outputList[i].outputValue = JSON.stringify(data.data);
                  this.outputHistory.push({name: 'Result', value: this.outputList[i].outputValue});
                }
                break;
              }
              this.outputHistory.push({name: this.outputList[i].userfriendlyName || this.outputList[i].name, value: this.outputList[i].outputValue});
              console.log(this.outputHistory);
            }
            catch(err){
              this.outputList[i].outputValue = JSON.stringify(data.data);
              this.outputHistory.push({name: 'Result', value: this.outputList[i].outputValue});
              console.log("error caught - " + err);
              break;
            }
          };
      }
    }
    else if(this.modelSubtype === 'h2o'){
      if(this.postprocessEnabled){
        if(data){
          this.outputList.forEach(output => {
            storeValues = [];
            output.predictionResult = 'Success';
            if(data.output){
              output.outputValue = data.output;
            }
            else{
              output.outputValue = data;
            }
            if(data.classprobabilities) {
              this.showDetails = true;
              data.classprobabilities.forEach(element => {
                this.outputsample.push(parseFloat(element));
              })
        
              var storeValues = [];
              output.allowedValues.forEach((i, j) => {storeValues.push({value: i, prob: (parseFloat(this.outputsample[j])*100).toFixed(2)})})
              var reversestoreValues = storeValues.sort(function(a,b){ return a.prob - b.prob});
              storeValues = storeValues.sort(function(a,b){ return b.prob - a.prob});
              
              console.log(reversestoreValues);
              console.log(storeValues);
              output.outputProb = [{name: output.name, values: storeValues}]
            }

            if(output.enums){
              output.enums.every(item => {
                console.log(item);
                console.log(output.outputValue);
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false;
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];
                      return false;           
                    });
                  }
                }
                else{
                  output.src = "";
                  return true;
                }
              })
            }
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          })
        }
        else{
          this.outputList.forEach(output => {
            output.outputValue = 'null';
            output.predictionResult = 'Success';
            if(output.enums){
              output.enums.every(item => {
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];
                      return false;              
                    });
                  } 
                }
                else{
                  output.src = "";
                  return true; 
                }
              })
            } 
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          })
        }
      }
      else if(data.success && data.output){
        console.log(this.outputList);
        this.outputList.forEach(output => {
          var storeValues = [];
          output.predictionResult = 'Success';
          output.outputValue = data.output;
          if(data.classprobabilities) {
            this.showDetails = true;
            data.classprobabilities.forEach(element => {
              this.outputsample.push(parseFloat(element));
            });
            output.allowedValues.forEach((i, j) => {storeValues.push({value: i, prob: (parseFloat(this.outputsample[j])*100).toFixed(2)})})
            var reversestoreValues = storeValues.sort(function(a,b){ return a.prob - b.prob});
            storeValues = storeValues.sort(function(a,b){ return b.prob - a.prob});
            
            console.log(reversestoreValues);
            console.log(storeValues);
            output.outputProb = [{name: output.name, values: storeValues}]
          }

          if(output.enums){
            output.enums.every(item => {
              console.log(item);
              console.log(output.outputValue);
              if(item.name == output.outputValue){
                output.text = item.text;
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false;
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    output.src = res.urls[0];
                    return false;           
                  });
                }
              }
              else{
                output.src = "";
                return true;
              }
            })
          }
          this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
        }) 
      }
      else if(data.success && !data.output){
        this.outputList.forEach(output => {
          output.outputValue = 'null';
          output.predictionResult = 'Success';
          if(output.enums){
            output.enums.every(item => {
              if(item.name == output.outputValue){
                output.text = item.text;
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false; 
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    output.src = res.urls[0];
                    return false;              
                  });
                } 
              }
              else{
                output.src = "";
                return true; 
              }
            })
          } 
          this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
        })
      }
      else{
        this.outputList.forEach(output => {
          output.outputValue = 'Error';
          output.src="";
        })
        if(data.message == 'No response from model predictor'){
          var stackTrace =  data.stack_trace;
        }
        else{
          var stackTrace =  data.message;
        }
        var predictionResult = 'Failed';
        this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
      }
    }
    else if(this.modelSubtype === 'jpmml'){
      if(data.success && data.output){
        if(data.output.length > 0){
          this.outputList.forEach(output => {
            output.predictionResult = 'success';
            output.outputValue = data.output[output.name];
            if(output.enums){
              output.enums.every(item => {
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];   
                      return false;           
                    });
                  }
                }
                else{
                  output.src = "";
                  return true; 
                }
              })
            }
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          });
        }
        else{
          this.outputList.forEach(output => {
            output.predictionResult = 'success';
            output.outputValue = 'null';
            if(output.enums){
              output.enums.every(item => {
                if(item.name == output.outputValue){
                  output.text = item.text;
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      output.src = res.urls[0];   
                      return false;           
                    });
                  }
                }
                else{
                  output.src = "";
                  return true; 
                }
              })
            }
            this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
          });
        }
      }
      else if(data.success && !data.output){
        this.outputList.forEach(output => {
          output.predictionResult = 'success';
          output.outputValue = 'null';
          if(output.enums){
            output.enums.every(item => {
              if(item.name == output.outputValue){
                output.text = item.text;
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  output.src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false; 
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    output.src = res.urls[0];   
                    return false;           
                  });
                }
              }
              else{
                output.src = "";
                return true; 
              }
            })
          }
          this.outputHistory.push({name: output.userfriendlyName || output.name, value: output.outputValue, predictionResult: output.predictionResult});
        });
      }
      else{
        this.outputList.forEach(output => {    
          output.outputValue = 'Error';
          output.src="";
        });
        if(data.message == 'No response from model predictor'){
          var stackTrace =  data.stack_trace;
        }
        else{
          var stackTrace =  data.message;
        }
        var predictionResult = 'Failed';
        this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
      }
    }
    else if(this.modelSubtype === 'pmml4s'){
      console.log("pmml4s")
      if(data.success && data.data){
        console.log("yes data.data")
        data.output = [];
        //if(data.data[0]["data"])
        try{
          data.data = eval(data.data)
        }
        catch(err){
          console.log("no eval")
        }

        for(let i=0; i<this.outputList.length; i++){
          data.output.push(data.data[0]["data"][this.outputList[i].name])
        }
      }
      console.log(data.output);
      if(data.success && data.output){
        if(data.output.length > 0){
          for(let i=0; i<this.outputList.length; i++){
            this.outputList[i].predictionResult = 'Success';
            if(data.output.length == this.outputList.length){
              console.log("output length equal")
              if(data.output[i]) this.outputList[i].outputValue = data.output[i]
              else this.outputList[i].outputValue = 'null';
            }
            else{
              console.log("pmml output length not equal")
              if(data.output) this.outputList[i].outputValue = JSON.stringify(data.output)
              else this.outputList[i].outputValue = 'null';
            }
            if(this.outputList[i].enums){
              this.outputList[i].enums.every(item => {
                if(item.name == this.outputList[i].outputValue){
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    this.outputList[i].src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      this.outputList[i].src = res.urls[0];    
                      return false;          
                    });
                  } 
                  this.outputList[i].text = item.text;
                }
                else{
                  this.outputList[i].src = "";
                  return true; 
                }
              })
            } 
            this.outputHistory.push({name: this.outputList[i].userfriendlyName || this.outputList[i].name, value: this.outputList[i].outputValue, predictionResult: this.outputList[i].predictionResult});
          }
        }
        else{
          for(let i=0; i<this.outputList.length; i++){
            this.outputList[i].predictionResult = 'Success';
            this.outputList[i].outputValue = 'null';
            if(this.outputList[i].enums){
              this.outputList[i].enums.every(item => {
                if(item.name == this.outputList[i].outputValue){
                  if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                    this.outputList[i].src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                    return false; 
                  }
                  else{
                    this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                      console.log(res);
                      this.outputList[i].src = res.urls[0];    
                      return false;          
                    });
                  } 
                  this.outputList[i].text = item.text;
                }
                else{
                  this.outputList[i].src = "";
                  return true; 
                }
              })
            } 
            this.outputHistory.push({name: this.outputList[i].userfriendlyName || this.outputList[i].name, value: this.outputList[i].outputValue, predictionResult: this.outputList[i].predictionResult});
          }
        }
      }
      else if(data.success && !data.output){
        for(let i=0; i<this.outputList.length; i++){
          this.outputList[i].predictionResult = 'Success';
          this.outputList[i].outputValue = 'null';
          if(this.outputList[i].enums){
            this.outputList[i].enums.every(item => {
              if(item.name == this.outputList[i].outputValue){
                if(item.fileName.substring(0,17) == 'clouderizerImage_'){
                  this.outputList[i].src = `${environment.baseurl}/userserving/assets/images/outputServing/${item.fileName}`;
                  return false; 
                }
                else{
                  this.fileService.getpresignedurls(item.fileName, this.companyId, "get").subscribe(res =>{
                    console.log(res);
                    this.outputList[i].src = res.urls[0];    
                    return false;          
                  });
                } 
                this.outputList[i].text = item.text;
              }
              else{
                this.outputList[i].src = "";
                return true; 
              }
            })
          } 
          this.outputHistory.push({name: this.outputList[i].userfriendlyName || this.outputList[i].name, value: this.outputList[i].outputValue, predictionResult: this.outputList[i].predictionResult});
        }
        // this.outputHistory.push({name: 'Result', value: 'null'});
      }
      else{
        for(let i=0; i<this.outputList.length; i++){
          this.outputList[i].outputValue = 'Error';
          this.outputList[i].src = "";
        }
        if(data.message == 'No response from model predictor'){
          var stackTrace =  data.stack_trace;
        }
        else{
          var stackTrace =  data.message;
        }
        var predictionResult = 'Failed';
        this.outputHistory = {stackTrace: stackTrace, predictionResult: predictionResult};
      }
    }
    return this.outputHistory;
  }

  downloadTemplate(){
    var csv_template = '';
    for(let i=0;i<this.inputList.length;i++){
      //work.push({header: this.inputList[i].name, key:this.inputList[i].name});
      csv_template += ((this.inputList[i].userfriendlyName || this.inputList[i].name) + ',');
    }
    //remove last comma
    csv_template = csv_template.replace(/,\s*$/, "");
    csv_template += '\r\n';
    const blob: Blob = new Blob([csv_template], {type: 'text/plain;charset=utf-8'} );
    saveAs( blob, 'sample.csv');
  }

  downloadPredicted(){
    var header = ['Time', 'Value'];
    var csvdata = [];
    for(let i=0; i<this.timeseriesdata.length; i++){
      var dataRows = [];
      dataRows = [new Date(this.timeseriesdata[i][0]), this.timeseriesdata[i][1]]
      dataRows.join(',')
      csvdata.push(dataRows)
    }

    console.log(csvdata);

    csvdata.unshift(header.join(','));

    var csvArray = csvdata.join('\r\n');
    var csvFile = new Blob([csvArray], {type: 'text/csv'});
    saveAs(csvFile, "Predicted_" + this.projectName + ".csv");
  }

  uploadCsv(event){
    this.predictionComplete = false;
    // event.target.value = '';
    console.log("uploading");
    console.log(event.target.files);
    var inputHeaders = [];
    this.inputList.forEach((input) => {
      inputHeaders.push(input.userfriendlyName || input.name);  //.toLowerCase()
    });
    let file  = event.target.files[0];
    let reader = new FileReader();
    reader.readAsText(file);  
    reader.onload = () => {  
      let csvData = reader.result;  
      let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);  

      this.headersRow = this.getHeaderArray(csvRecordsArray);  
      console.log(inputHeaders);
      console.log(this.headersRow);
      if(inputHeaders.toString() !== this.headersRow.toString()){``
        this.notifyService.notify('Input headers don\'t match, please upload a correct csv file', 'danger');
        return;
      }
      this.dataRecords = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, this.headersRow.length);
      this.outRecords = this.getDataRecordsArrayFromCSVFile(csvRecordsArray, this.headersRow.length);
      console.log(this.dataRecords);
      this.csvfiles.splice(0,1);
      this.csvfiles.push(event.target.files[0].name);
      this.uploadcsv = true;
      event.target.value = '';
      this.validForm = false;
    };  
    reader.onerror = function () {  
      console.log('error is occured while reading file!');  
    };

  }

  onFileChange(input, event) {
    const reader = new FileReader();
    console.log(event.target.result)
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
    
      reader.onload = (e) => {
        console.log(e)
        console.log(reader)
        var img:any = new Image();
        img.src = reader.result;
        input.imageSrc = reader.result as string;
      };
    }
  }

  onaudioChange(input, event) {
    input.url = "";
    const reader = new FileReader();
    console.log(event.target.result)
    if(event.target.files && event.target.files.length) {
      const [file] = event.target.files;
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        input.url = reader.result as string;
      };
    }
  }

  getHeaderArray(csvRecordsArr: any) {  
    let headers = (<string>csvRecordsArr[0]).split(',');  
    let headerArray = [];  
    for (let j = 0; j < headers.length; j++) {  
      headerArray.push(headers[j]);    //.toLowerCase()
    }  
    return headerArray;  
  } 

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any, headerLength: any) {  
    let csvArr = [];
    console.log(csvRecordsArray.length);
    for (let i = 1; i < csvRecordsArray.length; i++) {  
      let curruntRecord = (<string>csvRecordsArray[i]).split(',');  
      console.log(curruntRecord.length);
      let csvRecord={};
      if (curruntRecord.length == headerLength) {
        for(let i=0;i<curruntRecord.length;i++){
          console.log(curruntRecord.length);
          console.log(csvRecordsArray.length);
          csvRecord[this.headersRow[i]] = curruntRecord[i].trim();  
          console.log(csvRecord);
        }
        csvArr.push(csvRecord);  
      }  
    }  
    console.log(csvArr);
    return csvArr;  
  }


  openModal(ioType){
    var actionModel = this.modalService.open(ModalPopupBrowseComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "configPop" });
    console.log(this.dataRecords); 
    console.log(this.outputList);
    console.log(this.outRecords);
    actionModel.componentInstance.inputList = this.inputList;
    actionModel.componentInstance.outputList = this.outputList;
    actionModel.componentInstance.ioType = ioType;
    actionModel.componentInstance.modelSubtype = this.modelSubtype;
    if(ioType === 'output'){
      actionModel.componentInstance.columnList = this.outRecords;
    }
    else if(ioType === 'input'){
      this.some = {};
      console.log(this.dataRecords);
      actionModel.componentInstance.columnList = this.dataRecords;
      for(let i=0; i<this.objectKeys(this.dataRecords[0]).length; i++){
        for(let j=0; j<this.dataRecords.length;j++){
          console.log(this.objectKeys(this.dataRecords[0])[i]);
  
          if(this.modelSubtype === 'h2o' || this.modelSubtype === 'jpmml' || this.modelSubtype === 'pmml4s' || this.modelSubtype == 'pythonscore'){
            this.some[this.objectKeys(this.dataRecords[0])[i]+j] = ['', [Validators.required, Validators.max(this.inputList[i].max), Validators.min(this.inputList[i].min), invalidValueValidator(this.inputList[i].allowedValues)]]
          }
          if(this.modelSubtype === 'dai'){
            this.some[this.objectKeys(this.dataRecords[0])[i]+j] = ['', [Validators.max(this.inputList[i].max), Validators.min(this.inputList[i].min), invalidValueValidator(this.inputList[i].allowedValues)]]
          }
        }
      } 
      console.log(this.some);
      actionModel.componentInstance.some = this.some;
      
    }
    
    actionModel.componentInstance.ioconfigEvent.subscribe(data => {
      if(data.iotype == 'input'){        
        this.validForm = data.formStatus;
        console.log(this.validForm);
        if(this.validForm){
          var replacer = (key, value) => value === null ? '':  value;
          var header = Object.keys(data.data[0]);
          var csv = data.data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','));
          console.log(csv);
          csv.unshift(header.join(','));
          var csvArray = csv.join('\r\n');
          this.blob = new Blob([csvArray], {type: 'text/csv'});
        }
      }
      else if(data.iotype == 'output'){
        this.outRecords = data.data;
        console.log(this.outRecords);
       
        for(let i=0;i<this.servingHistoryArray.length;i++){
          console.log(data.data[i])
          this.servingHistoryArray[i].feedback = data.data[i].feedback;
          this.servingHistoryArray[i].company = this.companyId;
        }
        console.log(this.servingHistoryArray);
        this.authService.httpService('api/servinghistory/multiple', this.servingHistoryArray, 'post', (data) => {
          console.log('multirecord update success');
          this.notifyService.notify('Feedback saved', 'success');
          var projectList = {};
          var thumbs_up = 0;
          var thumbs_down = 0;
          
          this.authService.httpService('api/servinghistory?model='+this.servingid, null, 'get', (val) => {
            thumbs_up = val.filter(item => item.feedback === true).length
            thumbs_down = val.filter(item => item.feedback === false).length

            console.log(thumbs_up)
            console.log(thumbs_down)

            projectList = {projectId: this.projectId, thumbs_up: thumbs_up, thumbs_down: thumbs_down};

            this.authService.httpService('api/servingproject/feedback', projectList, 'post', (data) => {
              console.log('project details updated successfully');
            }, err => {
              this.notifyService.notify('Something went wrong while saving project details', 'danger');
            }, false);
          }, (err) =>{
            console.log(err)
          }, false);

        }, err => {
          console.log('multirecord update failed');
        })
      }
    })
  }

  submitCsv(){
    this.spinner.show('prediction');
    console.log("submitting csv");
    console.log(this.blob);
    const url = this.servingmodelId + '/predict';
    // const url = document.location.protocol +'//'+ document.location.hostname + '/userserving/'+ this.port + '-' +  this.servingmodelId + '-SH/predict';
    let formData = new FormData(); 
    formData.append('file', this.blob, 'input.csv'); 
    //formData.append("frombrowser", "true"); //frombrowser extra
    let headers = new Headers();
    headers.append('X-browser','yes'); //frombrowser commented
    this.http.post(url, formData, {headers: headers}).subscribe((result) => {
      this.authService.httpService('api/servinghistory/intercomscoring', {"scoring": true, "pprojectname": this.servingmodelId}, 'post', (val) => {  
      }, (err) =>{
        // console.log(err)
      }, false);
      this.tabItem = 2;
      this.predictionComplete = true;
      this.spinner.hide('prediction');
      var data = result.json();
      var requestfrom = data.requestfrom;
      var responseTime = data.responseTime/data.data.length;
      if(this.modelSubtype != 'pythonscore'){
        var outputResult = data.data;
      }
      else{
        if(typeof(data) === 'string'){
          var outputResult = eval(data).data;
        }
        else {
          var outputResult = data.data;
        }
      }
      this.modelHistoryArray = [];
      var tempmodelHistory = [];
      console.log(outputResult);
      for(let i=0;i<outputResult.length;i++){  
          this.inputHistory = [];
          for(let j=0;j<Object.keys(this.dataRecords[0]).length;j++){
            this.inputHistory.push({name:Object.keys(this.dataRecords[0])[j], value: Object.values(this.dataRecords[0])[j]})
          }
          console.log(this.inputHistory);
          console.log(new Date());
          var timestamp = Number(new Date());
          this.outputHistory = [];
          this.outputHistory = this.outputFormat(outputResult[i]); 
          console.log(this.outputHistory);
          this.modelHistory = {requestfrom: requestfrom, company: this.companyId, responseTime: responseTime, feedback: true, timestamp: new Date(timestamp), model: this.servingid, input: this.inputHistory, output: this.outputHistory};
          tempmodelHistory.push(this.modelHistory);
          this.modelHistoryArray.push(this.modelHistory);
      }   

      console.log(this.modelHistoryArray);
      this.authService.httpService('api/servinghistory/postmultiple', this.modelHistoryArray, 'post', (data) => {
        this.notifyService.notify('Model history details saved', 'success');
        console.log(data);
        this.servingHistoryArray = data;

        //------posting to servingproject model
        this.authService.httpService('api/servinghistory?model='+this.servingid, null, 'get', (value) => {  
          var thumbs_up = value.filter(item => item.feedback == true).length;
          var thumbs_down = value.filter(item => item.feedback == false).length;
          this.authService.httpService('api/servingproject/feedback', {projectId: this.projectId, thumbs_up: thumbs_up, thumbs_down: thumbs_down, requests: value.length}, 'post', (data) => {
            console.log('project details updated successfully');
          }, err => {
            this.notifyService.notify('Something went wrong while saving project details', 'danger');
          }, false);
        }, err => {
          this.notifyService.notify('Something went wrong while fetching model details', 'danger');
        }, false);
      }, err => {
        this.notifyService.notify('Something went wrong while saving model details', 'danger');
      }, false);
      //--------------------------------------------
      
      this.outRecords = [];
      for (let i=0;i<this.dataRecords.length;i++) {
        this.outRecords[i] = {}; 
        for (var prop in this.dataRecords[i]) {
            this.outRecords[i][prop] = this.dataRecords[i][prop]; 
        }
      }
      console.log("printing");
      console.log(this.dataRecords);
      console.log(this.outRecords);

      for(let j=0;j<this.outRecords.length;j++){
        for(let i=0;i<this.outputList.length;i++){
          console.log(tempmodelHistory);
          this.outRecords[j][this.outputList[i].userfriendlyName || this.outputList[i].name] = tempmodelHistory[j].output[i].value;
        }
        this.outRecords[j].feedback = true;
      }; 

    }, (err) => {
      this.authService.httpService('api/servinghistory/intercomscoring', {"scoring": false, "pprojectname": this.servingmodelId}, 'post', (val) => {  
      }, (err) =>{
        console.log(err)
      }, false);
      this.spinner.hide('prediction');
      this.notifyService.notify('Something went wrong with prediction', 'danger');
    });
  }

  changetoForm(){
    this.uploadcsv = false;
    this.predictionComplete = false;
    this.outputList.forEach(item => {
      item.outputValue = "";
      item.src = "";
      item.text = "";
    })
  }
}