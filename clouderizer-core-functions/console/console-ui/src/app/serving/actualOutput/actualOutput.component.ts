import { Directive, Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { v4 as uuid } from 'uuid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NotifyService } from '../../services/notify.service';
import { exception } from 'console';

@Component({
  selector: 'app-actual-output',
  templateUrl: './actualOutput.component.html',
  styleUrls: ['./actualOutput.component.scss']
})
export class ActualOutputComponent implements OnInit {

  closeModal(action) {
    this.activeModal.close(action);
  }

  @Input() timeSeries;
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
  }

  saveOutput(){
    this.actualoutputEvent.emit({data: this.actualRecords, save: true});
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
    };  
  }

  getDataRecordsArrayFromCSVFile(csvRecordsArray: any) {  
    var csvrecord = {"date":[], "output":[]};
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
        csvrecord["date"].push(Number(new Date(currentRecord[0])))
        csvrecord["output"].push(Number(currentRecord[1]))
      }  
    }
    catch(err){
      console.log(err);
      this.notifyService.notify('Incorrect timestamp format or no timestamp in csv file', 'danger');
      this.closeModal(false);
      return {}
    }
    
    console.log(csvrecord);
    return csvrecord;  
  }

}