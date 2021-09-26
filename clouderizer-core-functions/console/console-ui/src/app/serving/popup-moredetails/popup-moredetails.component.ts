import { Component, OnInit, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { fileService } from '../../services/s3fileupload.service';
import { saveAs } from 'file-saver';
import { NotifyService } from '../../services/notify.service';
import {HttpRequest, HttpClient, HttpHeaders} from '@angular/common/http';
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

declare var swal: any;
@Component({
  selector: 'app-popup-moredetails',
  templateUrl: './popup-moredetails.component.html',
  styleUrls: ['./popup-moredetails.component.scss']
})
export class PopupMoredetailsComponent implements OnInit {
  closeModal(action) {
		this.activeModal.close(action);
  }
  @Input() modelHistory;
  @Input() projectId;
  @Input() timeSeries;
  @Input() actual;
  @Input() training;

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
  finalinput:any[]=[];
  inputkeys:any[]=[];
  inputvalues:any[]=[];
  protype: string;
  notebookoutput: any;
  colors: any;
  // actual:any[]=[];
  predicted:any[]=[];
  lowerbound:any[]=[];
  upperbound:any[]=[];
  notebook: string;
  historyoutputfiles: any[]=[];

  constructor( 
    private fileService: fileService,
    private http: HttpClient,
    public activeModal: NgbActiveModal,
    private notifyService: NotifyService,
    private authService: AuthService) { 
    this.initChartData()
  }
  ngOnInit() {
    this.protype = this.training ? 'training' : 'prediction';
    
    if(this.training && this.modelHistory.outputFiles){
      this.notebook = this.modelHistory.outputFiles.filter(item => item.includes("output.ipynb"))[0];
      this.historyoutputfiles = this.modelHistory.outputFiles.filter(item => !item.includes("output.ipynb"));
    }
    if(!this.training && this.modelHistory.inputFiles){
      for(let i=0;i<this.modelHistory.inputFiles.length; i++){
        this.getpresignedurl(this.modelHistory.inputFiles[i].path, (data, err) => {
          if(!err && data) this.modelHistory.inputFiles[i].src = data;
          else this.modelHistory.inputFiles[i].src = "";
        })
      }
    }

    if(!this.training && this.modelHistory.outputFiles){
      for(let i=0;i<this.modelHistory.outputFiles.length; i++){
        this.getpresignedurl(this.modelHistory.outputFiles[i].path, (data, err) => {
          if(!err && data) this.modelHistory.outputFiles[i].src = data;
          else this.modelHistory.outputFiles[i].src = "";
        })
      }
    }

    if(this.training && this.modelHistory.input){
      var b;
      try{
        var ikeys:any = Object.keys(this.modelHistory.input)
        var ivalues:any = Object.values(this.modelHistory.input)
        for(let i=0;i<ivalues.length;i++){
          for(let j=0;j<this.modelHistory.inputFiles.length;j++){
            b = this.modelHistory.inputFiles[j].split('/').slice(2).join('/')
            console.log("b", b)
            console.log(ivalues[i])
            if(ivalues[i].includes(b)){
              console.log("deleting", ikeys[i])
              delete this.modelHistory.input[ikeys[i]]
            }
            console.log("after delete")
          }
        }
        console.log("model hist input", this.modelHistory.input);
        for(let i=0;i<Object.keys(this.modelHistory.input).length;i++){
          this.finalinput.push({"key":Object.keys(this.modelHistory.input)[i],"value":Object.values(this.modelHistory.input)[i]})
        }
      }
      catch(err){
        console.log("no problem, skip this")
      }
    }
    
    if(this.timeSeries){
      console.log(this.modelHistory.output);
      if(this.modelHistory.output){
        this.modelHistory.output.forEach(item => {
          this.predicted.push([Number(new Date(item.timestamp)), item.predicted])
          if(item.lower_bound){
            this.lowerbound.push([Number(new Date(item.timestamp)), item.lower_bound])
          }
          if(item.upper_bound){
            this.upperbound.push([Number(new Date(item.timestamp)), item.upper_bound])
          }
        })
        this.series = [{name: 'Predicted', data: this.predicted}];
        if(this.lowerbound && this.lowerbound.length > 0){
          this.series.push({name: 'Lower bound', data: this.lowerbound})
        }
        if(this.upperbound && this.upperbound.length > 0){
          this.series.push({name: 'Upper bound', data: this.upperbound})
        }
      }
      console.log(this.actual);
      if(this.actual && this.actual.length > 0){
        this.series.push({name: "Actual", data: this.actual});
      }
    }  
  }

  downLoadFile(data: any, item) {
    let blob = new Blob([data]);
    saveAs(blob, item.split("/")[4]);
  }

  nbview(){
    var parent = this;
    swal({
      title: `View notebook on nbviewer`,
      text: `Your notebook will be uploaded to nbviewer. Would you like to proceed?`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Yes'
    }).then(function(result) {
      if(result.value) {
        parent.fileService.getpresignedurls(parent.notebook, "get").subscribe(res =>{
          console.log(res.urls[0]);
          var nburl = res.urls[0];
          console.log("nburl",nburl);

          parent.authService.httpService('api/servinghistory/nbview', {nburl: nburl}, 'post', (data) => {
            console.log(data);
            window.open("https://nbviewer.jupyter.org"+data.url, "_blank");
          },
          (err) => {
            console.log(err);
            this.notifyService.notify('Error getting notebook', 'danger');
          });
        }, err => {
          console.log(err);
        });
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  downloadfiles(item){
    this.fileService.getpresignedurls(item, "get").subscribe(res =>{
      console.log(res.urls[0]);
      var downloadurl = res.urls[0];
      const headers = new HttpHeaders();
      headers.append('Accept', '*/*')
      this.http.get(downloadurl,{
        responseType: 'arraybuffer',headers:headers} 
       ).subscribe(response => this.downLoadFile(response, item));
    }, err => {
      console.log(err);
    });
  }

  getpresignedurl(item, cb){
    this.fileService.getpresignedurls(item, "get").subscribe(res =>{
      console.log(res.urls[0]);
      return cb(res.urls[0], null);
    }, err => {
      return cb(null, err)
    });
  }

  downloadnotebook(){
    if(this.notebook){
      this.fileService.getpresignedurls(this.notebook, "get").subscribe(res =>{
        console.log(res.urls[0]);
        var downloadurl = res.urls[0];
        const headers = new HttpHeaders();
        headers.append('Accept', '*/*')
        this.http.get(downloadurl,{
          responseType: 'arraybuffer',headers:headers} 
         ).subscribe(response => this.downLoadFile(response, this.notebook));
      }, err => {
        console.log(err);
      });
    }
    else{
      this.notifyService.notify('No output notebook got generated', 'info');
    }
  }

  public initChartData(): void {
    this.series = [
      {
        name: "Predicted",
        data: []
      },
      {
        name: 'Lower bound',
        data: []
      },
      {
        name: 'Upper bound',
        data: []
      },
      {
        name: 'Actual',
        data: []
      },
    ];

    this.stroke = {
      show: true,
      width: 2,
      curve: 'smooth',
      dashArray: [0, 0, 0, 0]
    }

    this.legend = {
      show: true,
      position: 'bottom',
      itemMargin: {
        horizontal: 5,
        vertical: 10
      }
    }

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

}
