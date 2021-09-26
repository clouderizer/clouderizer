import { Component, OnInit, ChangeDetectorRef, Output, EventEmitter, ElementRef, Input, ViewChild, HostListener } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import {MatChipInputEvent} from '@angular/material/chips';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { NotifyService } from '../../services/notify.service';
import { AuthService } from '../../services/auth.service';
import { SailsSocketService } from '../../services/sailssocket.service';
import { saveAs } from 'file-saver';
import { fileService } from '../../services/s3fileupload.service';
import { v4 as uuid } from 'uuid';
import { NgModel } from '@angular/forms';
import {Http, Headers} from '@angular/http';
import { MiscService } from '../../services/misc.service';

declare var swal: any;
declare var $:any; 
declare var thebelab:any;
declare var CodeMirror: any;
declare var cm: any;
@Component({
  selector: 'codeEditor',
  templateUrl: './codeEditor.component.html',
  styleUrls: ['./codeEditor.component.scss']
})

export class codeEditor implements OnInit {

  @Input() projectModel;
  @Input() type;
  @Input() user;
  @Input() inputList;
  @Input() outputList;
  @Input() projectType;
  @Output() output = new EventEmitter();

  execute: any;
  uninstalling: any;
  running: any;
  kernel: any;
  content: string;
  selectable = true;
  removable = true;
  readonly separatorKeysCodes: number[] = [ENTER, COMMA];
  addOnBlur = true;
  packages: any[]=[];
  kernelOptions: any;
  msgHideAndShow: boolean = false;
  baseURL = window.location.protocol + '//' + window.location.host;
  uploadHideAndShow: boolean = false;
  saveHideAndShow: boolean = false;
  saving: boolean = false;
  uploading: boolean = false;
  statusJupyter: string;
  installPackages: boolean;
  pipPackages: any[]=[];
  filename: string;
  presignedUrl: string;
  hover = [false];
  installing: boolean;
  dataSample: string;
  outputFields: any[]=[];
  
  closeModal(action) {
    this.output.emit({projectdetails: this.projectModel});
		this.activeModal.close(action);
  }
  
  
  constructor(
    public activeModal: NgbActiveModal,
    private notifyService: NotifyService,
    public authService: AuthService,
    private sailsSocketService: SailsSocketService,
    private fileService: fileService,
    private http: Http,
    private element: ElementRef,
    private miscService: MiscService,
  ) { 
  }

  ngOnInit() {
    if(!this.user){
      this.user = {};
    }
    // this.filename = this.projectModel['s3_zip_file'] + '_' + uuid()
    this.filename = this.projectModel['s3_zip_file'];
    console.log(this.projectModel);
    console.log(this.projectModel.jupyterStatus);
    console.log(this.outputList);

    if(this.type == 'Postprocess'){
      var sampleArray = [];
      var label = "";
      this.outputList.forEach(item =>{
        if(this.projectModel.subtype == 'h2o'){
          item.allowedValues.forEach(thing => {
            label += `"${thing}"/`
            sampleArray.push('<'+thing+'_probability>')
          });
        }
        else if(this.projectModel.subtype == 'dai'){
          sampleArray.push('"<'+item.name+'_value>"');
          this.outputFields.push('"'+item.name+'"');
        }
      });
      if(this.projectModel.subtype == 'h2o'){
        label = label ? label.slice(0, -1) : "<predictionOutput>";
        if(sampleArray.length > 0){
          this.dataSample = `Prediction o/p format: {"label": ${label}, "classprobabilities":[${sampleArray}]}`;
        }
        else{
          this.dataSample = `Prediction o/p format: {"label": ${label}}`;
        }
      }
      else if(this.projectModel.subtype == 'dai' && sampleArray.length > 0){
        this.dataSample = `Prediction o/p format: {"output":[${sampleArray}]}`;
      }
      else {
        this.dataSample = 'Prediction output';
      }
    }

    this.sailsSocketService.registerDashboardJupyter(this.updateStatus, this);
    this.sailsSocketService.registerDashboardServing(this.updateStatusModel, this);
    var options = {kernelOptions: {
      name: "python3",
      serverSettings: {
        "baseUrl": "http://127.0.0.1:3434",
        "token": "test-secret"
        }
      }
    }

    try{
      thebelab.bootstrap(options)
      .then(res => {
        console.log(res);  
        this.authService.httpService('api/user', this.user.id, 'get', (data) => {
          console.log(data)
          if(data.jupyterStatus == 'Not Running'){
            this.user.jupyterStatus = 'Running';
          }
          else if(!data.jupyterStatus){
            this.user.jupyterStatus = 'Running';
          }
          else{
            this.user.jupyterStatus = data.jupyterStatus;
          }
        }, err =>{
          console.log(err);
        }, false);
      })
      .catch(err => {
        console.log(err)
        this.user.jupyterStatus = 'Not Running';
      })
    }
    catch {
      this.notifyService.notify('Something went wrong, please try again after sometime', 'danger');
    }

    // this.authService.httpService('api/user', this.user.id , 'get', (data) => {
    //   console.log(data)
    //   if(data.pipPackages.length > 0){
    //     this.pipPackages = data.pipPackages.sort();
    //   }
    //   else{
    //     this.pipPackages = ['None installed yet'];
    //   }
    // }, err =>{
    //   console.log(err);
    // }, false);

    this.authService.httpService('api/servingmodel?servingproject='+this.projectModel.servingproject, null, 'get', (data) => {
      console.log(data)
      this.projectModel = data[0];

      if(this.projectModel.pipPackages && this.projectModel.pipPackages.length > 0){
        this.pipPackages = this.projectModel.pipPackages.sort();
      }
      else{
        this.pipPackages = ['None installed yet'];
      }

      if(this.type == 'Preprocess'){
        if(this.projectModel.preprocessCode){
          $('.CodeMirror')[0].CodeMirror.setValue(this.projectModel.preprocessCode);
          this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.preprocessCode.split("\n").indexOf("def preprocess(data):"), this.projectModel.preprocessCode.split("\n").indexOf("def preprocess(data):")+1)
          this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.preprocessCode.split("\n").indexOf("    return output"), this.projectModel.preprocessCode.split("\n").indexOf("    return output")+1)                
        }
        else{
          // $('.CodeMirror')[0].CodeMirror.setValue('\ndef preprocess(data):\n    #Your preprocess code here\n\n    return output\n\ndata = []\npreprocess(data)');
          // this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2)
          // this.getTextLock($('.CodeMirror')[0].CodeMirror, 4, 5)

          var preprocesscode = "\ndef preprocess(data):\n";
          console.log("preprocess code not in db");
          console.log(this.inputList);
          var imagepresent = false;
          var dataschema = {};
          var outputdataschema = {};
          outputdataschema["data"] = {};
          for(let i=0;i<this.inputList.length;i++){
            if(this.inputList[i].type == 'Image'){
              console.log("image present")
              imagepresent = true
              dataschema[this.inputList[i].name]="<filename>"
              preprocesscode+=`    ${this.inputList[i].name}_imgpath=data["${this.inputList[i].name}"] #Input image file path should be: data["${this.inputList[i].name}]\n    ${this.inputList[i].name}_img=Image.open(${this.inputList[i].name}_imgpath)`
            }
            else{
              dataschema[this.inputList[i].name]="<value>"
            }
          }

          for(let i=0;i<this.outputList.length;i++){
            if(this.outputList[i].type != 'Image'){
              outputdataschema["data"][this.outputList[i].name]="<value>"
            }
            else{
              dataschema[this.outputList[i].name]="<outputfilename>";
              preprocesscode+=`\n    ${this.outputList[i].name}_imgpath=data["${this.outputList[i].name}"] #Output image file path should be: data["${this.outputList[i].name}]\n    ${this.outputList[i].name}_img=Image.open(${this.outputList[i].name}_imgpath)`
            }
          }

          preprocesscode+=`\n    #Your preprocess code here\n\n    output = [${JSON.stringify(outputdataschema)}]\n    return output\n\ndata = ${JSON.stringify(dataschema)}\npreprocess(data)`
          
          $('.CodeMirror')[0].CodeMirror.setValue(preprocesscode);
          this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2)
            // this.getTextLock($('.CodeMirror')[0].CodeMirror, 4, 5)
            // this.getTextLock($('.CodeMirror')[0].CodeMirror, 6, 7)
        }
      }
      else if(this.type == 'Postprocess'){
        if(this.projectModel.postprocessCode){
          $('.CodeMirror')[0].CodeMirror.setValue(this.projectModel.postprocessCode);
          this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.postprocessCode.split("\n").indexOf("def postprocess(data):"), this.projectModel.postprocessCode.split("\n").indexOf("def postprocess(data):")+1)
          this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.postprocessCode.split("\n").indexOf("    return output"), this.projectModel.postprocessCode.split("\n").indexOf("    return output")+1)                
        }
        else{
          // if(this.projectModel.subtype == 'dai'){
          //   var code = `\ndef postprocess(data):\n    #Your postprocess code here\n    outputFields=[${this.outputFields}]\n\n    return output\n\ndata = {}  #${this.dataSample}\npostprocess(data)`;
          //   $('.CodeMirror')[0].CodeMirror.setValue(code);
          //   this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2);
          //   this.getTextLock($('.CodeMirror')[0].CodeMirror, 6, 7);
          // }
          // else{
          //   var code = `\ndef postprocess(data):\n    #Your postprocess code here\n\n    return output\n\ndata = {}  #${this.dataSample}\npostprocess(data)`
          //   $('.CodeMirror')[0].CodeMirror.setValue(code);
          //   this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2);
          //   this.getTextLock($('.CodeMirror')[0].CodeMirror, 5, 6);
          // }

          var postprocesscode = "\ndef postprocess(data):\n";
          console.log("postprocess code not in db");
          console.log(this.inputList);
          var imagepresent = false;
          var dataschema = {};
          var outputdataschema = {};
          outputdataschema["data"] = {};
          for(let i=0;i<this.inputList.length;i++){
            if(this.inputList[i].type == 'Image'){
              console.log("image present")
              imagepresent = true
              dataschema[this.inputList[i].name]="<filename>"
              postprocesscode+=`    ${this.inputList[i].name}_imgpath=data["${this.inputList[i].name}"] #Input image file path should be: data["${this.inputList[i].name}]\n    ${this.inputList[i].name}_img=Image.open(${this.inputList[i].name}_imgpath)`
            }
            else{
              dataschema[this.inputList[i].name]="<value>"
            }
          }

          for(let i=0;i<this.outputList.length;i++){
            if(this.outputList[i].type != 'Image'){
              outputdataschema["data"][this.outputList[i].name]="<value>"
            }
            else{
              dataschema[this.outputList[i].name]="<outputfilename>";
              postprocesscode+=`\n    ${this.outputList[i].name}_imgpath=data["${this.outputList[i].name}"] #Output image file path should be: data["${this.outputList[i].name}]\n    ${this.outputList[i].name}_img=Image.open(${this.outputList[i].name}_imgpath)`
            }
          }

          postprocesscode+=`\n    #Your postprocess code here\n\n    output = [${JSON.stringify(outputdataschema)}]\n    return output\n\ndata = ${JSON.stringify(dataschema)}\npostprocess(data)`
          
          $('.CodeMirror')[0].CodeMirror.setValue(postprocesscode);
          this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2)
        }
      }
      else if(this.type == 'Predict'){
        this.fileService.getpresignedurls(this.projectModel['s3_zip_file'], "get").subscribe(res =>{
          console.log(res);
          ;
          this.presignedUrl = res.urls[0];
          console.log(this.filename);
          console.log(this.presignedUrl);

          var fetchModelFile = `!test -f "/tmp/${this.filename}" || (echo "Downloading model file..." && echo "" && curl -o "/tmp/${this.filename}" "${this.presignedUrl}" && echo "" && echo "Download complete. You can run the code now!")`
          console.log(fetchModelFile);
          $('.CodeMirror')[0].CodeMirror.setValue(fetchModelFile);

          var runButton = document.getElementsByClassName('thebelab-run-button')[0];
          runButton.setAttribute('id', 'run');
          var run = document.getElementById('run')
          this.execute = true;
          run.click();
          
          // $('.CodeMirror')[0].CodeMirror.refresh();
          // $('.CodeMirror')[0].CodeMirror.setValue('print("Kernel is Ready!!!")');
          // run.click();
          // $('.CodeMirror')[0].CodeMirror.refresh();

          if(this.projectModel.predictCode){
            console.log("predictcode in db");
            var codeLines = this.projectModel.predictCode.split("\n")
            codeLines.forEach(item =>{
              if(item.substring(0,20) == '    with open("/tmp/'){
                codeLines[codeLines.indexOf(item)] = `    with open("/tmp/${this.filename}", "rb") as file:`
              }
              if(item.substring(0,15) == 'modelPath="/tmp/'){
                codeLines[codeLines.indexOf(item)] = `modelPath="/tmp/${this.filename}"`
              }
            });
            this.projectModel.predictCode = codeLines.join('\n');
            console.log(this.projectModel.predictCode);
            $('.CodeMirror')[0].CodeMirror.setValue(this.projectModel.predictCode);
            this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf("import pickle"), this.projectModel.predictCode.split("\n").indexOf("import pickle")+1)
            this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf("def predict(data, modelPath):"), this.projectModel.predictCode.split("\n").indexOf("def predict(data, modelPath):")+1)
            this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf(`modelPath="/tmp/${this.filename}"`), this.projectModel.predictCode.split("\n").indexOf(`modelPath="/tmp/${this.filename}"`)+1)
            // this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf(`    with open("/tmp/${this.filename}", "rb") as file:`), this.projectModel.predictCode.split("\n").indexOf(`    with open("/tmp/${this.filename}", "rb") as file:`)+1)
            // this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf("        pickle_model = pickle.load(file)"), this.projectModel.predictCode.split("\n").indexOf("        pickle_model = pickle.load(file)")+1)
            this.getTextLock($('.CodeMirror')[0].CodeMirror, this.projectModel.predictCode.split("\n").indexOf("    return output"), this.projectModel.predictCode.split("\n").indexOf("    return output")+1)                
          }
          else{
            console.log("predictcode not in db");
            console.log(this.inputList);
            // $('.CodeMirror')[0].CodeMirror.setValue(`import pickle\n\n\nmodelPath="/tmp/${this.filename}"\n\ndef predict(data):\n    with open(modelPath, "rb") as file:\n        pickle_model = pickle.load(file)\n    #Your prediction code here\n\n    return output\n\ndata = []\npredict(data)`);
            var predictcode = `import pickle\nfrom PIL import Image\n\n\nmodelPath="/tmp/${this.filename}"\n\ndef predict(data, modelPath):\n`
            var imagepresent = false;
            var dataschema = {};
            var outputdataschema = {};
            outputdataschema["data"] = {};
            outputdataschema["classprobabilities"] = [];
            var classprobabilities = [];
            for(let i=0;i<this.inputList.length;i++){
              if(this.inputList[i].type == 'Image'){
                console.log("image present")
                imagepresent = true
                dataschema[this.inputList[i].name]="<filename>"
                predictcode+=`    ${this.inputList[i].name}_imgpath=data["${this.inputList[i].name}"] #Input image file path should be: data["${this.inputList[i].name}]\n    ${this.inputList[i].name}_img=Image.open(${this.inputList[i].name}_imgpath)`
              }
              else{
                dataschema[this.inputList[i].name]="<value>"
              }
            }
  
            for(let i=0;i<this.outputList.length;i++){
              if(this.outputList[i].type != 'Image'){
                outputdataschema["data"][this.outputList[i].name]="<value>" 
                classprobabilities.push(`{"name": ${this.outputList[i].name}, "probability": <${this.outputList[i].name}_probability_value>}`)
              }
              else{
                dataschema[this.outputList[i].name]="<outputfilename>";
                predictcode+=`\n    ${this.outputList[i].name}_imgpath=data["${this.outputList[i].name}"] #Output image file path should be: data["${this.outputList[i].name}]\n    ${this.outputList[i].name}_img=Image.open(${this.outputList[i].name}_imgpath)`
              }
            }

            predictcode+=`\n    with open(modelPath, "rb") as file:\n        pickle_model = pickle.load(file)\n    #Your prediction code here\n\n    output = [${JSON.stringify(outputdataschema)}] #Include class probabilities in decimals if any to output list as key values. Format is classprobabilities: ${JSON.stringify(classprobabilities)}\n    return output\n\ndata = ${JSON.stringify(dataschema)}\npredict(data, modelPath)`
            
            $('.CodeMirror')[0].CodeMirror.setValue(predictcode);
            this.getTextLock($('.CodeMirror')[0].CodeMirror, 0, 1)
            this.getTextLock($('.CodeMirror')[0].CodeMirror, 4, 5)
            this.getTextLock($('.CodeMirror')[0].CodeMirror, 6, 7)
            // this.getTextLock($('.CodeMirror')[0].CodeMirror, 10, 11)
          }
        }, err => {
          console.log(err);
        });
      }
    }, err =>{
      console.log(err);
    }, false);

    $('.CodeMirror')[0].CodeMirror.setOption('lineNumbers', true);
    $('.CodeMirror')[0].CodeMirror.setOption('extraKeys', {"Tab": function(cm){cm.replaceSelection("    " , "end")}});
    $('.CodeMirror')[0].CodeMirror.setOption('autohint', true);
  
    var runButton = document.getElementsByClassName('thebelab-run-button')[0];
    runButton.innerHTML = 'Run';

    var restartButton = document.getElementsByClassName('thebelab-restart-button')[0];
    restartButton.innerHTML = 'Restart';

    var d = document.getElementsByClassName('thebelab-cell')[0];
    d.className += ' row';

    $('.thebelab-input, .thebelab-run-button, .thebelab-restart-button').wrapAll('<div class="wrapper"/>')
    console.log($('.wrapper ~ div').html());
    $('.wrapper ~ div').addClass('outputJupyter');
  }

  ngAfterViewInit(){
    $(".thebelab-run-button").click((event) =>{
      console.log("run button clicked")
      console.log($('.jp-OutputArea').html())
      if(!this.execute){
        var checkOutput = setInterval(()=>{
          if($('.jp-OutputArea').html() == ""){
            this.running = true;
          }
          else{
            this.running = false;
            clearInterval(checkOutput); 
          }
        }, 1000);
      }
      else{
        this.execute = false;
      }
      
      setTimeout(() =>{
        console.log($('.jp-OutputArea').html())
        console.log($('.jp-OutputArea').text())
        if(($('.jp-OutputArea').html() == '') || ($('.jp-OutputArea').text() == "Waiting for kernel...")){
          console.log("waiting for kernel");
          this.authService.httpService('http://127.0.0.1:3434/api/kernels', null, 'get', (data) => {
            },
          err => {
          console.log(err)
            if(err.status == 0){
              console.log("status 0 err connection refused")
              
              if(this.user.jupyterStatus != 'Starting' && this.user.jupyterStatus != 'Installing'){
                this.user.jupyterStatus = 'Not Running';
                // this.notifyService.notify('Kernel is not running', 'danger');
                this.running = false;
                if(checkOutput){
                  clearInterval(checkOutput); 
                }
                // this.authService.httpService('api/user/updatejupyterstatus', {userid: this.user.id, jupyterStatus: 'Not Running'}, 'post', (data) => {
                // }, err =>{
                // }, false);
              }
            }
            else {
              console.log("no error forbidden");
              if(this.user.jupyterStatus != 'Starting' && this.user.jupyterStatus != 'Installing'){
                this.user.jupyterStatus = 'Running';
              }
              // this.authService.httpService('api/user/updatejupyterstatus', {userid: this.user.id, jupyterStatus: 'Running'}, 'post', (data) => {
              // }, err =>{
              // }, false);
            }
          }, false, false)
        }
        else{
          console.log("kernel running");
        }
      }, 2000);
    });

  }

  updateStatusModel(model, my_this) {
    if(model && model.id && my_this.projectModel.id == model.id) {
      if(model.pipPackages && model.pipPackages.length > 0){
        my_this.pipPackages = model.pipPackages.sort();
        my_this.userreqs = my_this.pipPackages;
      }
      else{
        my_this.pipPackages = ['None installed yet'];
      }
    } 
  }

  remove(item): void {
    const index  = this.packages.indexOf(item);
    if (index >= 0) {
      this.packages.splice(index, 1);
    }
  }

  thebe_update_status_field(evt, data) {
    console.log("Thebe: status changed (" + data.status + "): " + data.message);
    console.log(data)
    console.log(evt)
  }

  updateStatus(user, my_this) {
    console.log("here is the user: " + user);
    if(user) {
        console.log(user);
        if(user.id) {
            // if(user.pipPackages.length > 0){
            //   my_this.pipPackages = user.pipPackages.sort();
            // }
            // else{
            //   my_this.pipPackages = ['None installed yet'];
            // }
            console.log(user.jupyterStatus)
            if(user.jupyterStatus != 'Not Running' && !my_this.installPackages){
              console.log(user);
              console.log("save user jupyter status");
              my_this.user = user;
            }
            if(user.jupyterStatus === 'Running' && !my_this.installPackages){
              setTimeout(() =>{
                console.log("jupyter running");
                my_this.user.jupyterStatus = 'Running';
                var options = {kernelOptions: {
                  name: "python3",
                  serverSettings: {
                    "baseUrl": "http://127.0.0.1:3434",
                    "token": "test-secret"
                    }
                  }
                }
                $('.thebelab-cell').remove();
                $('.saveUpload').after('<pre id="code" data-executable="true" data-language="python"></pre>');

                thebelab.bootstrap(options)
                  .then(res => {
                    console.log(res);
                    my_this.user.jupyterStatus = 'Running';
                    if(my_this.type == 'Predict'){
                      console.log(my_this.filename);
                      console.log(my_this.presignedUrl);
                      var fetchModelFile = `!test -f "/tmp/${my_this.filename}" || (echo "Downloading model file..." &&  echo "" && curl -o "/tmp/${my_this.filename}" "${my_this.presignedUrl}" && echo "" && echo "Download complete. You can run the code now!")`
                      console.log(fetchModelFile)
                      $('.CodeMirror')[0].CodeMirror.setValue(fetchModelFile);

                      var runButton = document.getElementsByClassName('thebelab-run-button')[0];
                      runButton.setAttribute('id', 'run');
                      var run = document.getElementById('run')
                      my_this.execute = true;
                      run.click();
                      // $('.CodeMirror')[0].CodeMirror.refresh();
                      // $('.CodeMirror')[0].CodeMirror.setValue('print("Kernel is Ready!!!")');
                      // run.click();
                      // $('.CodeMirror')[0].CodeMirror.refresh();
                    }
                  })
                  .catch(err => {
                    console.log(err)
                  })

                my_this.authService.httpService('api/servingmodel?servingproject='+my_this.projectModel.servingproject, null, 'get', (data) => {
                  console.log(data)
                  my_this.projectModel = data[0];

                  if(my_this.type == 'Preprocess'){
                    if(my_this.projectModel.preprocessCode){
                      $('.CodeMirror')[0].CodeMirror.setValue(my_this.projectModel.preprocessCode);
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.preprocessCode.split("\n").indexOf("def preprocess(data):"), my_this.projectModel.preprocessCode.split("\n").indexOf("def preprocess(data):")+1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.preprocessCode.split("\n").indexOf("    return output"), my_this.projectModel.preprocessCode.split("\n").indexOf("    return output")+1)                
                    }
                    else{
                      $('.CodeMirror')[0].CodeMirror.setValue('\ndef preprocess(data):\n    #Your preprocess code here\n\n    return output\n\ndata = []\npreprocess(data)');
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 4, 5)
                    }
                  }
                  else if(my_this.type == 'Postprocess'){
                    if(my_this.projectModel.postprocessCode){
                      $('.CodeMirror')[0].CodeMirror.setValue(my_this.projectModel.postprocessCode);
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.postprocessCode.split("\n").indexOf("def postprocess(data):"), my_this.projectModel.postprocessCode.split("\n").indexOf("def postprocess(data):")+1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.postprocessCode.split("\n").indexOf("    return output"), my_this.projectModel.postprocessCode.split("\n").indexOf("    return output")+1)                
                    }
                    else{
                        if(my_this.projectModel.subtype == 'dai'){
                          var code = `\ndef postprocess(data):\n    #Your postprocess code here\n    outputFields=[${my_this.outputFields}]\n\n    return output\n\ndata = {}  #${my_this.dataSample}\npostprocess(data)`;
                          $('.CodeMirror')[0].CodeMirror.setValue(code);
                          my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2);
                          my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 6, 7);
                        }
                        else{
                          var code = `\ndef postprocess(data):\n    #Your postprocess code here\n\n    return output\n\ndata = {}  #${my_this.dataSample}\npostprocess(data)`
                          $('.CodeMirror')[0].CodeMirror.setValue(code);
                          my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 1, 2);
                          my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 5, 6);
                        }
                    }
                  }
                  else if(my_this.type == 'Predict'){
                    if(my_this.projectModel.predictCode){
                      var codeLines = my_this.projectModel.predictCode.split("\n")
                      codeLines.forEach(item =>{
                        if(item.substring(0,20) == '    with open("/tmp/'){
                          codeLines[codeLines.indexOf(item)] = `    with open("/tmp/${my_this.filename}", "rb") as file:`
                        }
                      });
                      my_this.projectModel.predictCode = codeLines.join('\n');
                      console.log(my_this.projectModel.predictCode);
                      $('.CodeMirror')[0].CodeMirror.setValue(my_this.projectModel.predictCode);
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.predictCode.split("\n").indexOf("import pickle"), my_this.projectModel.predictCode.split("\n").indexOf("import pickle")+1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.predictCode.split("\n").indexOf("def predict(data, modelPath):"), my_this.projectModel.predictCode.split("\n").indexOf("def predict(data, modelPath):")+1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.predictCode.split("\n").indexOf(`modelPath="/tmp/${my_this.filename}"`), my_this.projectModel.predictCode.split("\n").indexOf(`modelPath="/tmp/${my_this.filename}"`)+1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, my_this.projectModel.predictCode.split("\n").indexOf("    return output"), my_this.projectModel.predictCode.split("\n").indexOf("    return output")+1)                
                    }
                    else{
                      $('.CodeMirror')[0].CodeMirror.setValue(`import pickle\n\n\nmodelPath="/tmp/${this.filename}"\ndef predict(data, modelPath):\n    with open(modelPath, "rb") as file:\n        pickle_model = pickle.load(file)\n    #Your prediction code here\n\n    return output\n\ndata = []\npredict(data, modelPath)`);
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 0, 1)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 3, 4)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 5, 6)
                      my_this.getTextLock($('.CodeMirror')[0].CodeMirror, 10, 11)
                    }
                  }
                  
                }, err =>{
                  console.log(err);
                }, false);

                $('.CodeMirror')[0].CodeMirror.setOption('lineNumbers', true);
                $('.CodeMirror')[0].CodeMirror.setOption('extraKeys', {"Tab": function(cm){cm.replaceSelection("    " , "end")}});
                $('.CodeMirror')[0].CodeMirror.setOption('autohint', true);
              
                var runButton = document.getElementsByClassName('thebelab-run-button')[0];
                runButton.innerHTML = 'Run';

                var restartButton = document.getElementsByClassName('thebelab-restart-button')[0];
                restartButton.innerHTML = 'Restart';

                var d = document.getElementsByClassName('thebelab-cell')[0];
                d.className += ' row';
                

                $('.thebelab-input, .thebelab-run-button, .thebelab-restart-button').wrapAll('<div class="wrapper"/>')
                console.log($('.wrapper ~ div').html());
                $('.wrapper ~ div').addClass('outputJupyter');

                $(".thebelab-run-button").click((event) =>{
                  console.log("run button clicked")
                  console.log($('.jp-OutputArea').html());
                  if(!my_this.execute){
                    var checkOutput = setInterval(()=>{
                      if($('.jp-OutputArea').html() == ""){
                        my_this.running = true;
                      }
                      else{
                        my_this.running = false;
                        clearInterval(checkOutput); 
                      }
                    }, 1000);
                  }
                  else{
                    my_this.execute = false;
                  }
                  setTimeout(() =>{
                    console.log($('.jp-OutputArea').html())
                    console.log($('.jp-OutputArea').text())
                    if(($('.jp-OutputArea').html() == '') || ($('.jp-OutputArea').text() == "Waiting for kernel...")){
                      console.log("waiting for kernel");
                      my_this.authService.httpService('http://127.0.0.1:3434/api/kernels', null, 'get', (data) => {
                        },
                      err => {
                      console.log(err)
                        if(err.status == 0){
                          console.log("status 0 err connection refused");
                          
                          if(user.jupyterStatus != 'Starting' && user.jupyterStatus != 'Installing'){
                              my_this.user.jupyterStatus = "Not Running";
                              my_this.notifyService.notify('Kernel is not running', 'danger');
                              my_this.running = false;
                              if(checkOutput){
                                clearInterval(checkOutput); 
                              }
                          //   my_this.authService.httpService('api/user/updatejupyterstatus', {userid: my_this.user.id, jupyterStatus: 'Not Running'}, 'post', (data) => {
                          //   }, err =>{
                          //   }, false);
                          }
                        }
                        else {
                          console.log("no error forbidden")
                          if(user.jupyterStatus != 'Starting' && user.jupyterStatus != 'Installing'){
                            my_this.user.jupyterStatus = "Running";
                          }
                          else{
                            my_this.user.jupyterStatus = user.jupyterStatus;
                          }
                          // my_this.authService.httpService('api/user/updatejupyterstatus', {userid: my_this.user.id, jupyterStatus: 'Running'}, 'post', (data) => {
                          // }, err =>{
                          // }, false);
                        }
                      }, false, false)
                    }
                    else{
                      console.log("kernel running");
                    }
                  }, 2000);
                });
              }, 3000)
              
            }
            else {
              my_this.installPackages = false;
            }
            console.log(my_this.user);
            // }
        }
    }
  }


  add(event: MatChipInputEvent): void {
    const input = event.input;
    const value = event.value;
    if ((value || '').trim()) {
      this.packages.push(value.trim());
      console.log(this.packages);
    }
    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  copyMessage(){  
    this.msgHideAndShow=true;  
    setTimeout(() => {    
      this.msgHideAndShow=false;  
    }, 3000);    
  }

  uploadMessage(){  
    this.uploadHideAndShow=true;  
    setTimeout(() => {    
      this.uploadHideAndShow=false;  
    }, 3000);    
  }

  saveMessage(){  
    this.saveHideAndShow=true;  
    setTimeout(() => {    
      this.saveHideAndShow=false;  
    }, 3000);    
  }

  copyCommand(){
    var input = <HTMLInputElement>document.getElementById('myInput');
    input.select();  
    document.execCommand('copy'); 
    input.setSelectionRange(0, 0);
    input.blur(); 
    this.copyMessage();
  }

  saveCode(){
    if(this.projectType != 'public'){
      this.saving = true;
      this.installPackages = true;
      if(this.type == 'Preprocess'){
        this.projectModel.preprocessCode = $('.CodeMirror')[0].CodeMirror.getValue();
      }
      else if(this.type == 'Postprocess'){
        this.projectModel.postprocessCode = $('.CodeMirror')[0].CodeMirror.getValue();
      }
      else if(this.type == 'Predict'){
        this.projectModel.predictCode = $('.CodeMirror')[0].CodeMirror.getValue();
        // var codeLines = $('.CodeMirror')[0].CodeMirror.getValue().split("\n");
        // var lineIndex = codeLines.indexOf(`modelPath="/tmp/${this.filename}"`);
        // console.log(lineIndex);
        // codeLines[lineIndex] = `modelPath="/tmp/model.pickle"`;
  
        // this.projectModel.predictCode = codeLines.join('\n');
        console.log(this.projectModel.predictCode);
      }
      
      this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
        console.log(value);
        this.saving = false;
        this.saveMessage();
        if(this.packages && this.packages.length > 0){
          this.authService.httpService('api/servingmodel/updatepippackages', {id: this.projectModel.id, pipPackages: this.packages}, 'post', (value) => {
            console.log(value); 
          },(err) => {
            console.log(err);
            this.notifyService.notify('Something went wrong while saving package details', 'danger');
          }, false);
        }
      },(err) => {
        this.notifyService.notify('Could not update model details', 'danger');
        this.saving = false;
        console.log(err);
      }, false);
  
      if(this.packages && this.packages.length > 0){
        this.authService.httpService('api/user/updatepippackages', {id: this.user.id, pipPackages: this.packages}, 'post', (value) => {
          console.log(value);
        },(err) => {
          console.log(err);
          this.notifyService.notify('Something went wrong while saving package details', 'danger');
        }, false);
      }
      else{
        this.installPackages = false;
      }
    }
    else{
      this.notifyService.notify('cannot save code for public projects', 'danger');
    }
  }

  uploadCode(){
    if(this.projectType != 'public'){
      this.uploading = true;
      this.installPackages = true;
      if(this.type == 'Predict'){
        this.projectModel.predictCode = $('.CodeMirror')[0].CodeMirror.getValue();
        var codeLines = $('.CodeMirror')[0].CodeMirror.getValue().split("\n");
        var lineIndex = codeLines.indexOf(`modelPath="/tmp/${this.filename}"`);
        var lineIndex_predict = codeLines.indexOf(`predict(data, modelPath)`);
        if(lineIndex > -1) codeLines[lineIndex] = `modelPath="/home/app/function/asset/model.file"`;
        if(lineIndex_predict > -1 ) codeLines[lineIndex_predict] = `#predict(data, modelPath)`;
        var uploadCode = codeLines.join('\n');
      }
      else if(this.type == 'Preprocess'){
        this.projectModel.preprocessCode = $('.CodeMirror')[0].CodeMirror.getValue();
        var codeLines = $('.CodeMirror')[0].CodeMirror.getValue().split("\n");
        var lineIndex = codeLines.indexOf(`preprocess(data)`);
        if(lineIndex > -1 ) codeLines[lineIndex] = `#preprocess(data)`;
        var uploadCode = codeLines.join('\n');
      }
      else if(this.type == 'Postprocess'){
        this.projectModel.postprocessCode = $('.CodeMirror')[0].CodeMirror.getValue();
        var codeLines = $('.CodeMirror')[0].CodeMirror.getValue().split("\n");
        var lineIndex = codeLines.indexOf(`postprocess(data)`);
        if(lineIndex > -1 ) codeLines[lineIndex] = `#postprocess(data)`;
        var uploadCode = codeLines.join('\n');
      }
      this.projectModel.savedon = (new Date().getTime() / 1000).toFixed()
      this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
        console.log(value);
        if(this.packages && this.packages.length > 0){
          this.authService.httpService('api/servingmodel/updatepippackages', {id: this.projectModel.id, pipPackages: this.packages}, 'post', (value) => {
            this.projectModel.pipPackages = value.pipPackages;
            this.projectModel.userreqs = value.pipPackages;
            console.log(value); 
            this.uploadcodetos3(uploadCode);
          },(err) => {
            console.log(err);
            this.notifyService.notify('Something went wrong while saving package details', 'danger');
          }, false);
        }
        else{
          this.uploadcodetos3(uploadCode);
        }
      },(err) => {
        this.notifyService.notify('Could not save code', 'danger');
        console.log(err);
      }, false);
  
      if(this.packages && this.packages.length > 0){
        this.authService.httpService('api/user/updatepippackages', {id: this.user.id, pipPackages: this.packages}, 'post', (value) => {
          console.log(value);
        },(err) => {
          console.log(err);
          this.notifyService.notify('Something went wrong while saving package details', 'danger');
        }, false);
      }
      else{
        this.installPackages = false;
      }
    }
    else{
      this.notifyService.notify('cannot upload code for public projects', 'danger');
    }  
  }

  uploadcodetos3(uploadCode){
    var ctype = 'text/plain;charset=utf-8'
    const blob: Blob = new Blob([uploadCode], {type: ctype} );
    var fileName = this.type + '_' + uuid() + '.py'
    if(this.type == 'Preprocess'){
      this.projectModel.preprocessCodePath = fileName;
      
    }
    else if(this.type == 'Postprocess'){
      this.projectModel.postprocessCodePath = fileName;
      
    }
    else if(this.type == 'Predict'){
      this.projectModel.predictCodePath = fileName;
      
    }
    this.fileService.getpresignedurls(fileName, "put", ctype).subscribe(res =>{
      console.log(res); 
      if(res.success){
        const fileuploadurl = res.urls[0];
        this.fileService.uploadfileAWSS3(fileuploadurl, blob).subscribe(data => {
          console.log(data);
        }, err => {
          this.uploading = false;
          this.notifyService.notify('File(s) upload failed: ${err}', 'danger');
          console.log(err);
        },
        () => {
          this.uploading = false;
          console.log("finished upoading code");
          this.uploadMessage();
          this.projectModel.savedon = (new Date().getTime() / 1000).toFixed()
          this.authService.httpService('api/servingmodel', this.projectModel, 'put', (value) => {
          },(err) => {
            this.notifyService.notify('Could not update model details', 'danger');
          }, false);
      });
      }
      else {
        this.notifyService.notify(res.msg, 'danger');
        this.uploading = false;
      }
    });
  }

  updatepipPackages(pipCode, install, item?){
    console.log(this.pipPackages);
    var editor = $('.CodeMirror')[0].CodeMirror;
    var preValue = editor.getValue();
    var runButton = document.getElementsByClassName('thebelab-run-button')[0];
    runButton.setAttribute('id', 'run');
    var run = document.getElementById('run');
    this.execute = true;
    editor.setValue(pipCode);
    run.click();
    editor.setValue(preValue);

    if(this.type == 'Predict'){
      this.getTextLock(editor, preValue.split("\n").indexOf("import pickle"), preValue.split("\n").indexOf("import pickle")+1)
      this.getTextLock(editor, preValue.split("\n").indexOf("def predict(data, modelPath):"), preValue.split("\n").indexOf("def predict(data, modelPath):")+1)
      this.getTextLock(editor, preValue.split("\n").indexOf(`modelPath="/tmp/${this.filename}"`), preValue.split("\n").indexOf(`modelPath="/tmp/${this.filename}"`)+1)
      // this.getTextLock(editor, preValue.split("\n").indexOf(`    with open("/tmp/${this.filename}", "rb") as file:`), preValue.split("\n").indexOf(`    with open("/tmp/${this.filename}", "rb") as file:`)+1)
      // this.getTextLock(editor, preValue.split("\n").indexOf("        pickle_model = pickle.load(file)"), preValue.split("\n").indexOf("        pickle_model = pickle.load(file)")+1)
      this.getTextLock(editor, preValue.split("\n").indexOf("    return output"), preValue.split("\n").indexOf("    return output")+1)                
    }
    else if(this.type == 'Preprocess'){
      this.getTextLock(editor, preValue.split("\n").indexOf("def preprocess(data):"), preValue.split("\n").indexOf("def preprocess(data):")+1)
      this.getTextLock(editor, preValue.split("\n").indexOf("    return output"), preValue.split("\n").indexOf("    return output")+1)                
    }
    else if(this.type == 'Postprocess'){
      this.getTextLock(editor, preValue.split("\n").indexOf("def postprocess(data):"), preValue.split("\n").indexOf("def postprocess(data):")+1)
      this.getTextLock(editor, preValue.split("\n").indexOf("    return output"), preValue.split("\n").indexOf("    return output")+1)                
    }
    
    
    if(install){
      this.authService.httpService('api/user/updatepippackages', {id: this.user.id, pipPackages: this.packages}, 'post', (value) => {
        console.log(value);
      },(err) => {
        console.log(err);
        this.notifyService.notify('Something went wrong while saving package details', 'danger');
      }, false);
  
      this.authService.httpService('api/servingmodel/updatepippackages', {id: this.projectModel.id, pipPackages: this.packages}, 'post', (value) => {
        console.log(value);
        
      },(err) => {
        console.log(err);
        this.notifyService.notify('Something went wrong while saving package details', 'danger');
      }, false); 
    }
    else{
      this.authService.httpService('api/user/deletepippackage', {id: this.user.id, pipPackage: item}, 'post', (value) => {
        console.log(value);
      },(err) => {
        console.log(err);
        this.notifyService.notify('Something went wrong while updating model', 'danger');
      }, false);
  
      this.authService.httpService('api/servingmodel/deletepippackage', {id: this.projectModel.id, pipPackage: item}, 'post', (value) => {
        console.log(value);
      },(err) => {
        console.log(err);
      }, false); 
    }
    
  }

  uninstall(item){
    var pipCode = `!pip3 uninstall -y ${item}`;
    var parent = this;
    swal({
      title: `Remove ${item}`,
      text: `This will uninstall '${item}' in your Jupyter environment. Click uninstall to continue!`,
      type: 'info',
      showCancelButton: true,
      confirmButtonColor: 'green',
      cancelButtonColor: 'red',
      confirmButtonText: 'Uninstall'
    }).then(function(result) {
      if(result.value){
        parent.pipPackages.splice(parent.pipPackages.indexOf(item), 1);
        console.log(parent.pipPackages);
        var checkOutput = setInterval(()=>{
          if($('.jp-OutputArea').html() == ""){
            parent.uninstalling = true;
          }
          else{
            parent.uninstalling = false;
            clearInterval(checkOutput); 
          }
        }, 1000);
        var install = false;
        parent.installPackages = true;
        parent.updatepipPackages(pipCode, install, item);
      }
      else if(result.dismiss === swal.DismissReason.cancel){
        console.log("closed");
      }
    });
  }

  install(){
    if(this.projectType != 'public'){
      var checkOutput = setInterval(()=>{
        if($('.jp-OutputArea').html() == ""){
          this.installing = true;
        }
        else{
          this.installing = false;
          clearInterval(checkOutput); 
        }
      }, 1000);
  
      if(this.packages && this.packages.length <= 0){
        this.notifyService.notify('please add packages to install', 'danger');
      }
      else{
        this.installPackages = true;
        var pipCode = '!pip3 install '
        this.packages.forEach(item => {
          pipCode = pipCode + item + ' '
        });
        var install = true;
        this.updatepipPackages(pipCode, install);
        this.packages = [];
      }
    }
    else{
      this.notifyService.notify('cannot install for public projects', 'danger');
    }
  }

  getTextLock(editor, startLine, endLine)
  {
    const doc = editor.getDoc();
    const options = Object.freeze({ readOnly: true, className: "readOnly", css: "background-color: #d0f0f5"});
    let mark = doc.markText(
      {line: startLine, ch: 0},
      {line: endLine, ch: 0},
      options
    );

    return function(newText) {
      if (typeof newText !== "string")
        throw new Error("text lock only allows replacements with strings");
      if (newText[newText.length - 1] !== "\n")
        newText += "\n";
      const positioning = mark.find();
      mark.clear();
      doc.replaceRange(newText, positioning.from, positioning.to);
      startLine = positioning.from.line;
      endLine = startLine + newText.split("\n").length - 1;
      mark = doc.markText(
        {line: startLine, ch: 0},
        {line: endLine, ch: 0},
        options
      );
    };
  }

}