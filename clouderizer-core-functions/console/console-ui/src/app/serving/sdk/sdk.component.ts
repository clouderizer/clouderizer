import { Component, OnInit, ChangeDetectorRef, Input, ViewChild } from '@angular/core';
import { HighlightResult } from 'ngx-highlightjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { environment } from '../../../environments/environment';
import { GetServerlessUrl } from '../../services/getServerlessUrl.service';

declare var swal: any;

@Component({
  selector: 'sdk',
  templateUrl: './sdk.component.html',
  styleUrls: ['./sdk.component.scss']
})
export class sdkComponent implements OnInit {

  closeModal(action) {
		this.activeModal.close(action);
  }
  @Input() sdkObject;
  @Input() input;
  @Input() training;
  @Input() projectName;
  @Input() ppname;
  code: any;
  response: HighlightResult;
  msgHideAndShow: boolean = false;
  inputFieldsString: string="";
  hostName: string="";
  serverlessurl: string;
  
  constructor(
    public activeModal: NgbActiveModal,
    public serverlessService: GetServerlessUrl,
  ) { }

  ngOnInit() {
    if(!this.ppname){
      this.ppname = "<functionname>"
    }
    //this.serverlessurl = this.serverlessService.getServerlessUrl();
    this.serverlessService.getServerlessUrl().subscribe(res =>{
      this.serverlessurl = res.url;
    }, err => {
    });
    this.hostName = document.location.protocol +'//'+ document.location.hostname;
    var imagecount = this.input['inputList'].filter(i => i.type == "Image")
    if(!this.training && imagecount.length == 0){
      if(!this.sdkObject.port){
        this.sdkObject.port = '<port>';
      }
      if(!this.sdkObject.modelId){
        this.sdkObject.modelId = '<modelId>';
      }
      var inputFields = {};
  
      if(this.input){
        if(this.sdkObject.language == 'Python' || this.sdkObject.language == 'Node.js'){
          this.input['inputList'].forEach(item => {
            inputFields[item.name] = '<' + item.name + '>'
          })
        }
        else if(this.sdkObject.language == 'Java'){
          this.input['inputList'].forEach(item => {
            if(this.input['inputList'].indexOf(item) == 0){
              this.inputFieldsString = this.inputFieldsString + '{" +\n"\\"' + item.name + '\\": \\"' + `<${item.name}>` + '\\", '
            }
            else if(this.input['inputList'].indexOf(item) == this.input['inputList'].length-1){
              this.inputFieldsString = this.inputFieldsString + '" +\n"\\"' + item.name + '\\": \\"' + `<${item.name}>` + '\\"" +\n"}'
            }
            else{
              this.inputFieldsString = this.inputFieldsString + '" +\n"\\"' + item.name + '\\": \\"' + `<${item.name}>` + '\\", '
            }
          });
        }
        else if(this.sdkObject.language == 'C#'){
          this.input['inputList'].forEach(item => {
            if(this.input['inputList'].indexOf(item) == 0){
              this.inputFieldsString = this.inputFieldsString + '"{\\"' + item.name + '\\":\\"' + `<${item.name}>` + '\\", '
            }
            else if(this.input['inputList'].indexOf(item) == this.input['inputList'].length-1){
              this.inputFieldsString = this.inputFieldsString + '\\"' + item.name + '\\": \\"' + `<${item.name}>` + '\\"}"'
            }
            else{
              this.inputFieldsString = this.inputFieldsString + '\\"' + item.name + '\\": \\"' + `<${item.name}>` + '\\", '
            }
          });
        }
      }
      else{
        var inputFields = {};
      }
  
      if(this.sdkObject.language == 'Python'){
        this.code = `
        import requests
  
        url = "${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict"
        
        json = ${JSON.stringify(inputFields)}
        headers = {
          'Content-Type','application/json'
        }
        params = {
        }
        
        response = requests.request('POST', url, json=json, headers=headers, params=params)
        
        print(response.text)`
    
      }
      else if(this.sdkObject.language == 'Curl'){
        this.code = `curl -X POST `
        this.input['inputList'].forEach(item => {
         this.code += `--data "${item.name}=<${item.name}_value>" `
        })
        this.code += `${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict`
      }
      else if(this.sdkObject.language == 'Node.js'){
       this.code = `
       var request = require('request');
       var options = {
         method: 'POST',
         url: '${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict',
         headers: {
          'Content-Type','application/json'
         },
         json: ${JSON.stringify(inputFields)}
       };
       
       request(options, function (error, response, body) {
         if (error) throw new Error(error);
       
         console.log(body);
       });`
      }
     
      else if(this.sdkObject.language == 'Java'){
      this.code = `
      package org.kodejava.example.httpclient;
  
      import org.apache.http.HttpResponse;
      import org.apache.http.client.HttpClient;
      import org.apache.http.client.methods.HttpPost;
      import org.apache.http.entity.ContentType;
      import org.apache.http.entity.StringEntity;
      import org.apache.http.impl.client.HttpClientBuilder;
      
      public class HttpPostJsonExample {
        public static void main(String[] args) throws Exception {
          String payload = "data=${this.inputFieldsString}";
          StringEntity entity = new StringEntity(payload,
                  ContentType.APPLICATION_JSON);
  
          HttpClient httpClient = HttpClientBuilder.create().build();
          HttpPost request = new HttpPost("${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict");
          request.setEntity(entity);
  
          HttpResponse response = httpClient.execute(request);
          System.out.println(response.getStatusLine().getStatusCode());
        }
      }`
      }
  
      else if(this.sdkObject.language == 'C#'){
       this.code = `
       using System;
       using System.IO;
       using System.Net;
       using System.Text;
       
       namespace Examples.System.Net
       {
        public class WebRequestPostExample
        {
          public static void Main()
          {
            WebRequest request = WebRequest.Create("${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict");
            request.Method = "POST";
            string postData = ${this.inputFieldsString};
            byte[] byteArray = Encoding.UTF8.GetBytes(postData);
            request.ContentType = "application/json";
            request.ContentLength = byteArray.Length;
            Stream dataStream = request.GetRequestStream();
            dataStream.Write(byteArray, 0, byteArray.Length);
            dataStream.Close();
            WebResponse response = request.GetResponse();
            Console.WriteLine(((HttpWebResponse)response).StatusDescription);
            using (dataStream = response.GetResponseStream())
            {
                StreamReader reader = new StreamReader(dataStream);
                string responseFromServer = reader.ReadToEnd();
                Console.WriteLine(responseFromServer);
            }
            response.Close();
          }
        }
      }`
      }
    }
    else if(this.training || imagecount.length > 0){

      if(this.training) var url = `${this.hostName}/api/async-function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/notebook`
      else var url = `${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict`

      if(this.sdkObject.language == 'Curl'){
        if(this.training){
          this.code = `curl -X POST -H "x-callback-url: <callback url>" -F "param1=x" -F "param2=y" -F "file1=@<filepath1>" -F "file2=@<filepath2>" ${this.hostName}/api/async-function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/notebook`
        }
        else{
          this.code = `curl -X POST `
          this.input['inputList'].forEach(item => {
          if(item.type != 'Image'){
            this.code += `-F "${item.name}=<${item.name}_value>" `
          }
          else{
            this.code += `-F "${item.name}=@<filepath>" `
          }
          })
          this.code += `${this.serverlessurl}/function/${this.ppname.replace('_', '-').replace(/\s+/g, '')}/predict`
        }
      }
      else if(this.sdkObject.language == 'Node.js'){
       this.code = `
        const formData = {
          // Pass a simple key-value pair
          my_field: 'my_value',
          // Pass data via Buffers
          my_buffer: Buffer.from([1, 2, 3]),
          // Pass data via Streams
          my_file: fs.createReadStream(__dirname + '/unicycle.jpg'),
          // Pass multiple values /w an Array
          attachments: [
            fs.createReadStream(__dirname + '/attachment1.jpg'),
            fs.createReadStream(__dirname + '/attachment2.jpg')
          ],
          // Pass optional meta-data with an 'options' object with style: {value: DATA, options: OPTIONS}
          // Use case: for some types of streams, you'll need to provide "file"-related information manually.
          // See the "form-data" README for more information about options: https://github.com/form-data/form-data
          custom_file: {
            value:  fs.createReadStream('/dev/urandom'),
            options: {
              filename: 'topsecret.jpg',
              contentType: 'image/jpeg'
            }
          }
        };
        url = "${url}"
        request.post({url:url, formData: formData}, function optionalCallback(err, httpResponse, body) {
          if (err) {
            return console.error('upload failed:', err);
          }
          console.log('Upload successful!  Server responded with:', body);
        });`
      }
      else if(this.sdkObject.language == 'Python'){
        this.code = `
        import requests
  
        url = "${url}"
        
        json = '{}' #json body
        headers = {
          'Content-Type','application/json'
        }
        
        files = {'file': open('<filepath>', 'rb')} #file upload
        response = requests.request('POST', url, json=json, headers=headers, files=files) #use files parameter if uploading files, use json if sending json body.
        print(response.text)`
      }
      else if(this.sdkObject.language == 'Java'){
        this.code = `
        package org.kodejava.example.httpclient;
    
        import org.apache.http.HttpResponse;
        import org.apache.http.client.HttpClient;
        import org.apache.http.client.methods.HttpPost;
        import org.apache.http.entity.ContentType;
        import org.apache.http.entity.StringEntity;
        import org.apache.http.impl.client.HttpClientBuilder;
        
        public class HttpPostJsonExample {
          public static void main(String[] args) throws Exception {
            String payload = "data=${this.inputFieldsString}";
            StringEntity entity = new StringEntity(payload,
                    ContentType.APPLICATION_JSON);
              
            HttpClient httpClient = HttpClientBuilder.create().build();
            HttpPost request = new HttpPost("${url}");
            request.setEntity(entity);
            HttpResponse response = httpClient.execute(request);
            System.out.println(response.getStatusLine().getStatusCode());
            
            //Sending multipart form data(uploading files)
            CloseableHttpClient httpClient = HttpClients.createDefault();
            HttpPost uploadFile = new HttpPost("${url}");
            MultipartEntityBuilder builder = MultipartEntityBuilder.create();
            builder.addTextBody("field1", "yes", ContentType.TEXT_PLAIN);
            File f = new File("[/path/to/upload]");
            builder.addBinaryBody(
                "file",
                new FileInputStream(f),
                ContentType.APPLICATION_OCTET_STREAM,
                f.getName()
            );
            HttpEntity multipart = builder.build();
            uploadFile.setEntity(multipart);
            CloseableHttpResponse response = httpClient.execute(uploadFile);
            HttpEntity responseEntity = response.getEntity();
          }
        }`
        }
    
        else if(this.sdkObject.language == 'C#'){
         this.code = `
          // MultipartFormData with multiple parameters, including a file.

          // Read file data
          FileStream fs = new FileStream("c:\\people.doc", FileMode.Open, FileAccess.Read);
          byte[] data = new byte[fs.Length];
          fs.Read(data, , data.Length);
          fs.Close();

          // Generate post objects
          Dictionary<string, object> postParameters = new Dictionary<string, object>();
          postParameters.Add("filename", "People.doc");
          postParameters.Add("fileformat", "doc");
          postParameters.Add("file", new FormUpload.FileParameter(data, "People.doc", "application/msword"));

          // Create request and receive response
          string postURL = "${url}";
          string userAgent = "Someone";
          HttpWebResponse webResponse = FormUpload.MultipartFormDataPost(postURL, userAgent, postParameters);

          // Process response
          StreamReader responseReader = new StreamReader(webResponse.GetResponseStream());
          string fullResponse = responseReader.ReadToEnd();
          webResponse.Close();
          Response.Write(fullResponse);`
        }
    }
  }

  onHighlight(e) {
    this.response = {
      language: e.language,
      relevance: e.relevance,
      second_best: '{...}',
      top: '{...}',
      value: '{...}'
    }
  }

  textMessageFunc(msgText){  
    this.msgHideAndShow=true;  
    setTimeout(() => {    
      this.msgHideAndShow=false;  
    }, 3000);    
  }

  copyCommand(){
  const copyText = document.getElementById("code").textContent;
  const textArea = document.createElement('textarea');
  textArea.textContent = copyText;
  document.body.append(textArea);
  textArea.select();
  document.execCommand("copy");
  textArea.style.display= "none";
  this.textMessageFunc('Text');
  }
}