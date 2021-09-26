import { Component, OnInit, ViewChild, ElementRef, EventEmitter, Output, Input } from '@angular/core';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { NotifyService } from '../../services/notify.service';
import { MiscService } from '../../services/misc.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
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
  ApexPlotOptions
} from "ng-apexcharts";

declare var swal: any;

@Component({
  selector: 'quota',
  templateUrl: './quota-modal.component.html',
  styleUrls: ['./quota-modal.component.css']
})
export class QuotaModalComponent implements OnInit {

  public series1: ApexAxisChartSeries;
  public series2: ApexAxisChartSeries;
  public series3: ApexAxisChartSeries;
  public chart: ApexChart;
  public legend: ApexLegend;
  // public dataLabels: ApexDataLabels;
  public plotOptions: ApexPlotOptions;
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
  allocinvs:number;
  allocexec:number;
  allocprojects:number;
  refreshing: boolean=false;

  closeModal(action) {
		this.activeModal.close(action);
  }

  @Input() timeSum;
  @Input() invCount;
  @Input() timeSumStandard;
  @Input() timeSumHighMemory;
  @Input() timeSumGPU;
  @Input() projectsLength;

  msgHideAndShow: boolean = false;
  chartOptions: any;

  constructor( 
    public activeModal: NgbActiveModal,
    public authService: AuthService,
    public router: Router,
    public notifyService: NotifyService,
    public miscService: MiscService
  ) { 
    this.chartOptions = {
      chart: {
        height: 220,
        type: "radialBar",
        dropShadow: {
          enabled: true,
          top: 5,
          left: 2,
          blur: 10,
          opacity: 0.25
        }
      },
      plotOptions1: {
        radialBar: {
          hollow: {
            margin: 0,
            size: "80%",
            background: "#fff",
            position: "front"
          },

          track: {
            background: "#e7e7e7",
            strokeWidth: "97%",
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
    
          dataLabels: {
          }
        }
      },
      plotOptions2: {
        radialBar: {
          hollow: {
            margin: 0,
            size: "80%",
            background: "#fff",
            position: "front"
          },

          track: {
            background: "#e7e7e7",
            strokeWidth: "97%",
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
    
          dataLabels: {
          }
        }
      },
      plotOptions3: {
        radialBar: {
          hollow: {
            margin: 0,
            size: "80%",
            background: "#fff",
            position: "front"
          },

          track: {
            background: "#e7e7e7",
            strokeWidth: "97%",
            margin: 5, // margin is in pixels
            dropShadow: {
              enabled: false,
              top: 0,
              left: 0,
              blur: 3,
              opacity: 0.5
            }
          },
    
          dataLabels: {
          }
        }
      },
      series1: [0],
      series2: [0],
      series3: [0],
      stroke: {
        lineCap: "round"
      },
      labels1: ["Invocations"],
      labels2: ["Execution time(min)"],
      labels3: ["Projects"]
    }
  }

  ngOnInit() {
    console.log("timehm", this.timeSumHighMemory)
    console.log("timestandard", this.timeSumStandard)
    console.log("timegpu", this.timeSumGPU)
    this.allocinvs = 1000000000;
    this.allocexec = 1000000000;
    this.allocprojects = 50;
    var a = this.invCount
    var b = this.timeSum
    var c = this.projectsLength
    this.chartOptions.series1=[(this.invCount/this.allocinvs)*100];
    this.chartOptions.series2=[(this.timeSum/this.allocexec)*100];
    this.chartOptions.series3=[(this.projectsLength/this.allocprojects)*100];
    this.chartOptions.plotOptions1.radialBar.dataLabels = {
      show: true,
      name: {
        offsetY: -20,
        show: true,
        color: "#888",
        fontSize: "13px"
      },
      value: {
        formatter: <any>function(val) {
          return a || 0;
        },

        color: "#111",
        fontSize: "30px",
        show: true
      }
    }
    this.chartOptions.plotOptions2.radialBar.dataLabels = {
      show: true,
      name: {
        offsetY: -20,
        show: true,
        color: "#888",
        fontSize: "13px"
      },
      value: {
        formatter: <any>function(val) {
          return b || 0;
        },

        color: "#111",
        fontSize: "30px",
        show: true
      }
    }
    this.chartOptions.plotOptions3.radialBar.dataLabels = {
      show: true,
      name: {
        offsetY: -20,
        show: true,
        color: "#888",
        fontSize: "13px"
      },
      value: {
        formatter: <any>function(val) {
          return c || 0;
        },

        color: "#111",
        fontSize: "30px",
        show: true
      }
    }
  }

  copyCommand(){
    var input = <HTMLInputElement>document.getElementById('myInput');
    input.select(); 
    document.execCommand('copy'); 
    input.setSelectionRange(0, 0);
    input.blur(); 
    this.textMessageFunc('Text');
  }

  textMessageFunc(msgText){  
    this.msgHideAndShow=true;  
    setTimeout(() => {    
      this.msgHideAndShow=false;  
    }, 3000);    
  }
}

  