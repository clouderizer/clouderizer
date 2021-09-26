import { Directive, Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifyService } from '../services/notify.service';
import { exception } from 'console';
import { environment } from 'src/environments/environment.prod';

@Component({
  selector: 'app-actual-output',
  templateUrl: './actualOutput.component.html',
  styleUrls: ['./actualOutput.component.scss']
})
export class ActualOutputComponent implements OnInit {

  closeModal(action) {
    this.activeModal.close(action);
  }

  @Input() outputList;
  @Input() timeSeries;
  @Input() imageEmotion;
  @Output() actualoutputEvent = new EventEmitter();
  actualRecords: any;
  files: any[]=[];
  actualOutput: any;
  
  constructor(
    public activeModal: NgbActiveModal,
    private notifyService: NotifyService,
  ) {}


  ngOnInit() {
    console.log(this.timeSeries);
    console.log("inside actual");
    if(!this.timeSeries){
      console.log("inside not timeseries")
      for (let i=0; i<this.outputList.length; i++){  
        if(this.outputList[i].allowedValues && this.outputList[i].allowedValues.length > 0){
          this.outputList[i].actualOutput = this.outputList[i].allowedValues[0];
        }
        else if(this.outputList[i].min && this.outputList[i].max){
          this.outputList[i].actualOutput = this.outputList[i].min;
        }
        else if(['Multiline Text', 'Text', 'Enum'].includes(this.outputList[i].type)){
          this.outputList[i].actualOutput = "sample text";   
        }
        else if(['Integer', 'Whole', 'None'].includes(this.outputList[i].type)){
          this.outputList[i].actualOutput = 0;
        }          
      }
    }
    console.log("outputList")
    console.log(this.outputList)
  }

  saveOutput(){
    if(this.timeSeries){
      this.actualoutputEvent.emit({data: this.actualRecords, save: true});
    }
    else if(this.outputList && this.outputList.length > 0){
      this.actualoutputEvent.emit({data: this.outputList, save: true});
    }
    else{
      this.actualoutputEvent.emit({data: this.actualOutput, save: true});
    }
    
    this.closeModal(false);
  }

  fileUpload(event){
    this.files.splice(0, 1)
    let file = event[0];
    this.files.push(file.name)
    let reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {  
      let csvData = reader.result;  
      let csvRecordsArray = (<string>csvData).split(/\r\n|\n/);
      this.actualRecords = this.getDataRecordsArrayFromCSVFile(csvRecordsArray);
      // event.target.value = '';
    };  
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any) {  
    var csvrecord = {};
    console.log(csvRecordsArray);
    console.log(csvRecordsArray.length);
    try{
      for (let i = 0; i < csvRecordsArray.length; i++) {  
        let currentRecord = (<string>csvRecordsArray[i]).split(',');  
        console.log(currentRecord)
        if(!Number(new Date(currentRecord[0]))){
          this.notifyService.notify('Incorrect timestamp format or no timestamp in csv file', 'danger');
          this.closeModal(false);
          return {}
        }
        csvrecord[Number(new Date(currentRecord[0]))] = currentRecord[1]
      }  
    }
    catch(err){
      this.notifyService.notify('Incorrect timestamp format or no timestamp in csv file', 'danger');
      this.closeModal(false);
      return {}
    }
    
    console.log(csvrecord);
    return csvrecord;  
  }

}