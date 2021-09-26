import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {MatPaginator} from '@angular/material/paginator';
import {MatTableDataSource} from '@angular/material/table';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PopupMoredetailsComponent } from '../popup-moredetails/popup-moredetails.component';
import { errorMetricsComponent } from '../errorMetrics/errorMetrics.component';
import { AuthService } from '../../services/auth.service';
import { ActivatedRoute } from '@angular/router';
import { Chart, ChartType } from "chart.js";
import { SingleDataSet, Label, Color } from "ng2-charts";
import { saveAs } from 'file-saver';
import {MatSort} from '@angular/material/sort';
import { SailsSocketService } from '../../services/sailssocket.service';
import { ActualOutputComponent } from '../actualOutput/actualOutput.component';
import { NotifyService } from '../../services/notify.service';
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
  ApexStroke
} from "ng-apexcharts";

import { dataSeries } from "./data-series";

@Component({
  selector: 'app-deploy-serving',
  templateUrl: './deploy-serving.component.html',
  styleUrls: ['./deploy-serving.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class DeployServingComponent implements OnInit {

  public series: ApexAxisChartSeries;
  public series2: ApexAxisChartSeries;
  public series3: ApexAxisChartSeries;
  public chart: ApexChart;
  public legend: ApexLegend;
  public dataLabels: ApexDataLabels;
  public markers: ApexMarkers;
  public title: ApexTitleSubtitle;
  public title2: ApexTitleSubtitle;
  public title3: ApexTitleSubtitle;
  public fill: ApexFill;
  public yaxis: ApexYAxis;
  public yaxis2: ApexYAxis;
  public yaxis3: ApexYAxis;
  public xaxis: ApexXAxis;
  public tooltip: ApexTooltip;
  public theme: ApexTheme;
  public theme2: ApexTheme;
  public theme3: ApexTheme;
  public stroke: ApexStroke;
  public errorTypes: any;
  timeSeries: boolean;
  errorMetric: any;
  public projectList: any;
  public projectName: string;
  public projectType:string;
  public modelList: any;
  public projectId: string;
  dates: any[]=[];
  pageSize:any;
  training: boolean;
  requests:any[]=[];
  likes:any[]=[];
  chartLabels:any[]=[];
  dislikes:any[]=[];
  responseTime: any[]=[];
  modelHistory: any;
  modelHistoryLength: number;
  csvFile: any;
  datesP: any[]=[];
  protype: string;
  actual:any[]=[];
  columnsToDisplay = ['loadBalance','model', 'noOfRequests', 'Feedback', 'responsetime' , "likes" , 'dislikes','notResponded','viewmore' ];
  
  columnsToDisplay2 = [];
  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild("myChart", {static: true}) myChart: ElementRef;
  @ViewChild("requests", {static: true}) requestscanvas: ElementRef;
  @ViewChild("likes", {static: true}) likescanvas: ElementRef;
  @ViewChild("dislikes", {static: true}) dislikescanvas: ElementRef;
  @ViewChild("responseTime", {static: true}) responsecanvas: ElementRef;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  requestsChartColors;
  likesChartColors;
  dislikesChartColors;
  responseTimeChartColors;
  dislikesChartData:any[]=[];
  requestsChartData:any[]=[];
  likesChartData:any[]=[];
  responseTimeChartData:any[]=[];
  context:CanvasRenderingContext2D;

  constructor(
    private modalService: NgbModal,
    private authService: AuthService,
    private route: ActivatedRoute,
    private sailsSocketService: SailsSocketService,
    private notifyService: NotifyService,
  ) { 
    this.initChartData();
  }

  public initChartData(): void {
    this.series = [
      {
        name: "Requests",
        data: []
      },
     
    ];

    this.series2 = [
      {
        name: "Response",
        data: []
      },
    ]

    this.series3 = [
      {
        name: "Dislikes",
        data: []
      },
      {
        name: "Likes",
        data: [] 
      }
    ]

    this.stroke = {
      show: true,
      width: 2,
      curve: 'smooth'
    }

    this.legend = {
      show: true,
      position: 'top'
    }

    this.chart = {
      type: "area",
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

    this.theme2 = {
      palette: 'palette2'
    };

    this.theme3 = {
      palette: 'palette7'
    };

    this.dataLabels = {
      enabled: false
    };

    this.markers = {
      size: 3
    };

    this.title = {
      text: "Requests",
      align: "left",
      style: {
        fontSize: "12px",
        color: "black",
        fontFamily: "MontserratSemiBold",
        fontWeight: "500"
      }
    };

    this.title2 = {
      text: "Prediction response time",
      align: "left",
      style: {
        fontSize: "12px",
        color: "black",
        fontFamily: "MontserratSemiBold",
        fontWeight: "500"
      }
    };

    this.title3 = {
      text: "Feedback",
      align: "left",
      style: {
        fontSize: "12px",
        color: "black",
        fontFamily: "MontserratSemiBold",
        fontWeight: "500"
      }
    };

    this.fill = {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100]
      }
    };

    this.yaxis = {
      title: {
        text: "Count"
      },
      tickAmount: 6
    };

    this.yaxis2 = {
      title: {
        text: "Average Response(ms)"
      },
      tickAmount: 6
    };

    this.yaxis3 = {
      title: {
        text: "Count"
      },
      tickAmount: 6
    };

    this.xaxis = {
      type: "datetime"
    };

    this.tooltip = {
      shared: false
    };
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

  onChartClick(event) {
    console.log(event);
  }

  downloadCSV(){
    var header = ['Time', 'Response time', 'Feedback'];
    console.log(this.modelHistory);

    this.modelHistory.data[0].input.forEach(item => {
      header.push(item.name)
    });

    this.modelHistory.data[0].output.forEach(item => {
      header.push(item.name)
    });

    console.log(header);
    var csvdata = [];
    for(let i=0; i<this.modelHistory.data.length; i++){
      var dataRows = [];
      dataRows = [this.modelHistory.data[i].timestamp, this.modelHistory.data[i].responseTime, this.modelHistory.data[i].feedback]
      this.modelHistory.data[i].input.forEach(item => {
        dataRows.push(item.value)
      });
  
      this.modelHistory.data[i].output.forEach(item => {
        dataRows.push(item.value)
      });

      dataRows.join(',')
      csvdata.push(dataRows)
    }

    console.log(csvdata);

    csvdata.unshift(header.join(','));

    var csvArray = csvdata.join('\r\n');
    this.csvFile = new Blob([csvArray], {type: 'text/csv'});
    saveAs(this.csvFile, "Analytics_" + this.projectName + ".csv");
  }
  
  ngOnInit() {
    this.route.queryParams.subscribe(params => 
      { 
        this.projectName = params.name;
        this.projectId = params.id;
        this.projectType = params.type;
    });    
    this.sailsSocketService.registerDashboardHistory(this.updateStatus, this);
    this.sailsSocketService.registerDashboardServing(this.updateStatusModel, this);
    this.loadmodels();
  }

  errorMetrics(){
    console.log("error metrics");
    var actionModel = this.modalService.open(errorMetricsComponent, { centered: true, size:'lg', backdrop: 'static', windowClass: "moreDetailsPopup" })
    actionModel.componentInstance.records = this.errorTypes;
    actionModel.result.then((result) => { 
    }, (reason) => {
    });
  }

  onResize(event) {
    console.log(event.target.innerHeight);
    if(event.target.innerHeight < 600) {
      this.pageSize = 8;
    }
    else if (event.target.innerHeight > 600 && event.target.innerHeight < 800) {
      this.pageSize = 12;
    }
    else if (event.target.innerHeight > 800 && event.target.innerHeight < 1000) {
      this.pageSize = 20;
    } else {
      this.pageSize = 25;
    }
  }

  onRefresh(){
    this.loadmodels();
  }

  getProjectIndex(id, my_this) {
    for(var i=0;i<my_this.modelHistory.data.length;i++) {
      if(my_this.modelHistory.data[i].id == id)
        return i;
    }
    return -1;
  }

  updateStatus(history, my_this) {
    console.log("modelid", my_this.modelList[0].id);
    if(history && history.id && history.model == my_this.modelList[0].id) {
      console.log(my_this.modelHistory.data);
      var i = my_this.getProjectIndex(history.id, my_this);
      if(i >= 0) {
        console.log("old record update");
        my_this.modelHistory.data[i] = history;
        my_this.modelHistory._updateChangeSubscription(); 
        my_this.prepareGraphs(my_this.modelHistory.data);  
      }
      else{
        console.log("new record created");
        my_this.modelHistory.data.unshift(history);
        my_this.modelHistory._updateChangeSubscription();
        my_this.modelHistoryLength = my_this.modelHistory.data.length;
      }
    } 
  }

  updateStatusModel(model, my_this) {
    if(model && model.id && my_this.modelList[0].id == model.id) {
      if(model.actualOutput && model.resampled){
        for(let i=0; i<Object.keys(model.actualOutput).length; i++){
          my_this.actual.push([Number(new Date(Number(Object.keys(model.actualOutput)[i]))), Number(Object.values(model.actualOutput)[i])]);
        }
      }
    } 
  }

  loadmodels() {
    console.log(this.projectId);
    this.authService.httpService('api/servingmodel?servingproject='+this.projectId, null, 'get', (data) => {
      console.log(data);
      this.modelList = data;
      this.modelList.forEach(model => {
        this.errorTypes = model.errorMetric;
        this.timeSeries = model.timeSeries;
        this.training = model.training;
        this.protype = this.training ? 'training' : 'prediction';
        if(this.training){
          this.columnsToDisplay2 = ['timestamp', 'inputfiles', 'outputfiles', 'prediction', 'time', 'moredetails' ];
        }
        else{
          this.columnsToDisplay2 = ['timestamp', 'input', 'output', 'responsetime' , 'feedback' , 'prediction', 'moredetails' ];
        }
        this.authService.httpService('api/servinghistory/loadhistory', {modelid: model.id}, 'post', (data) => {
          // Getting charts data
          if(data){
            console.log(data);
            console.log("after fetching data");
            var sortedData = data.sort(function(a,b){ return +new Date(b.timestamp) - +new Date(a.timestamp)});
            this.modelHistory = sortedData;
            this.modelHistory = new MatTableDataSource(this.modelHistory);
            this.modelHistory.paginator = this.paginator;
            console.log("before fetching length");
            console.log(this.modelHistory.data);
            this.modelHistoryLength = this.modelHistory.data.length;
            console.log(sortedData);
            if(!this.training){
              this.prepareGraphs(sortedData);
            } 
          }
        },
        (err) => {
          console.log(err);
        });
        
        if(model.errorData){
          var squaresum = 0;
          var itemsum = 0;
          model.errorData.forEach(item => {
            squaresum +=item[0]
            itemsum +=item[1]
          });
          if(itemsum > 0){
            this.errorMetric = Math.sqrt((squaresum/itemsum)).toFixed(2);
          }
        }
        if(model.actualOutput && model.resampled){
          for(let i=0; i<Object.keys(model.actualOutput).length; i++){
            this.actual.push([Number(new Date(Number(Object.keys(model.actualOutput)[i]))), Number(Object.values(model.actualOutput)[i])]);
          }
        } 
      })   
    },
    (err) => {
      console.log(err);
    });
  }

  uploadActual(){
    var actionModel = this.modalService.open(ActualOutputComponent, { centered: true, backdrop: 'static', windowClass: "aboutPop" }); 
    actionModel.componentInstance.timeSeries = this.timeSeries;
    actionModel.componentInstance.actualoutputEvent.subscribe(data => {
      if(data.save && this.modelHistory.data && this.modelHistory.data.length > 0){
        this.modelList[0].actualOutput = data.data;
        var csvrecord = {"date1":[], "output1":[]};
        for(let i=0; i<this.modelHistory.data.length; i++){
          if(!this.modelHistory.data[i].output.predictionResult){
            csvrecord["date1"].push(Number(new Date(this.modelHistory.data[i].output[0].timestamp)))
            csvrecord["date1"].push(Number(new Date(this.modelHistory.data[i].output[1].timestamp)))
            csvrecord["output1"].push(Number(this.modelHistory.data[i].output[0].predicted)) 
            csvrecord["output1"].push(Number(this.modelHistory.data[i].output[1].predicted))
            break; 
          }
        };
        if(csvrecord["date1"].length > 0){
          this.modelList[0].predicted = csvrecord;
          this.authService.httpService('api/servingmodel/updateactual', this.modelList[0], 'post', (data) => {
            console.log('Real values updated successfully');
            this.notifyService.notify('Real values updated successfully', 'success');
            var actualOutput = [];
            for(let i=0; i<Object.keys(data.data).length; i++){
              actualOutput.push([Number(new Date(Number(Object.keys(data.data)[i]))), Number(Object.values(data.data)[i])]);
            };
            this.actual = actualOutput;
            var c = 0;
            var d = 0;
            for(let i=0; i<this.modelHistory.data.length; i++){
              var predicteddata = [];
              if(!this.modelHistory.data[i].output.predictionResult && !this.modelHistory.data[i].errorCalculated){
                this.modelHistory.data[i].output.forEach(item => {
                  try {
                    predicteddata.push([Number(new Date(item.timestamp)), Number(item.predicted)])
                  }
                  catch(err){
                    return;
                  }
                });
                
                for(let i=0; i<predicteddata.length; i++){
                  for(let j=0; j<actualOutput.length; j++){
                    if(predicteddata[i][0] === actualOutput[j][0]){
                      c += (Math.pow(predicteddata[i][1] - actualOutput[j][1], 2))
                      d +=1
                      break;
                    }
                    else{
                      continue;
                    }
                  }
                }
              }
            }
            var errorData = {"errordata": [c,d], "modelId": this.modelList[0].id};
            this.authService.httpService('api/servingmodel/updateError', errorData, 'post', (data) => {
              console.log(data);
            }, err => {
            },false);
          }, err => {
          });
        }
        else{
          this.authService.httpService('api/servingmodel', this.modelList[0], 'put', (data) => {
            console.log('Actual data updated successfully');
            this.notifyService.notify('Real values updated successfully', 'success');
          }, err => {
          });
        }  
      }
      else if(data.save && (!this.modelHistory || !this.modelHistory.data || this.modelHistory.data.length == 0)) {
        console.log("no predictions yet")
        this.modelList[0].actualOutput = data.data;
        this.authService.httpService('api/servingmodel', this.modelList[0], 'put', (data) => {
          console.log('Actual data updated successfully');
          this.notifyService.notify('Real values updated successfully', 'success');
        }, err => {
        });
      }
    })
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  } 

  prepareGraphs(sortedData){
    var items=[]; 
    sortedData.forEach((day) => {
      console.log(day);
      console.log(items);
      const date = new Date(new Date(day.timestamp).toString().split(' ').slice(1,4).join(" ")).getTime();
      console.log(date);
      console.log(day);
      if(!items[date]){
        items[date] = [];
      }
      items[date].push(day);
    });

    console.log(items);

    var itemArrays = Object.keys(items).map((date) => {
      return {
        date,
        rows: items[date]
      };
    });

    console.log(itemArrays);
    itemArrays.reverse();
    this.requests = [];
    this.likes = [];
    this.dislikes = [];
    this.responseTime = [];

    itemArrays.forEach(item => {
      this.requests.push([parseInt(item.date)+86400000, item.rows.length]);
      this.likes.push([parseInt(item.date)+86400000, item.rows.filter(i => { return i.feedback == true && i.output.predictionResult != 'Failed'}).length])
      this.dislikes.push([parseInt(item.date)+86400000, item.rows.filter(i => { return i.feedback == false && i.output.predictionResult != 'Failed'}).length])
      var totalResponseTime = 0;
      for(let i=0; i<item.rows.length;i++){
        if(item.rows[i].responseTime){
          totalResponseTime += parseInt(item.rows[i].responseTime)
        }
      }
      var avgResponse = Math.round(totalResponseTime/item.rows.filter(i => {return i.responseTime != undefined}).length);
      if(avgResponse == 0){
        avgResponse = NaN;
      }
      this.responseTime.push([parseInt(item.date)+86400000, avgResponse]);
    })

    console.log(this.requests)
    console.log(this.likes);
    console.log(this.dislikes);
    console.log(this.responseTime);

    console.log(this.datesP);
    this.series = [
      {
        name: "Requests",
        data: this.requests
      },
    ];

    this.series2 = [
      {
        name: "Response",
        data: this.responseTime
      },
    ]

    this.series3 = [
      {
        name: "Dislikes",
        data: this.dislikes
      },
      {
        name: "Likes",
        data: this.likes
      }
    ]
  }

  openPop(item) {
    var actionModel = this.modalService.open(PopupMoredetailsComponent, { centered: true,size:'lg', backdrop: 'static', windowClass: "moreDetailsPopup" })
    actionModel.componentInstance.modelHistory = item;
    actionModel.componentInstance.projectId = this.projectId;
    actionModel.componentInstance.timeSeries = this.timeSeries;
    actionModel.componentInstance.actual = this.actual;
    actionModel.componentInstance.training = this.training;
    actionModel.result.then((result) => {
    }, (reason) => {
    });
  }

  fetchuser() {
    this.authService.httpService('api/servingproject/fetchuser', null , 'get', (data) => {   
      console.log(data);              
    }, (err) => {
        console.log(err);   
    });
  }
}