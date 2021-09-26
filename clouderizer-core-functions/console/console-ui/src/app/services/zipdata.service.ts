
import { Injectable } from '@angular/core';

declare var window:any;
declare var zip:any;

@Injectable()
export class ZipDataService {
  public zipFileEntry = undefined;
  public zipWriter = undefined;
  public writer = undefined;
  public creationMethod;
  public URL = window.webkitURL || window.mozURL || window.URL;
  public requestFileSystem = window.webkitRequestFileSystem || window.mozRequestFileSystem || window.requestFileSystem;

  setCreationMethod(method) {
    zip.workerScriptsPath = "assets/js/";
    this.creationMethod = method;
  }

  reset() {
    this.zipWriter = null;  
  }

  addFiles(files, oninit, onadd, onprogress, onend) {
    var addIndex = 0;

    function nextFile(obj) {
      var file = files[addIndex];
      onadd(file);
      var names = file.webkitRelativePath.split('/');
      if(names && names.length > 0) {
        var count = 0;
        var path = '';
        for(let n of names) {
          count++;
          if(count == names.length) {
            path = path + n;
            if(n.startsWith('.')) {
              
              addIndex++;
              if (addIndex < files.length)
                nextFile(obj);
              else
                onend();
            } else {
              obj.zipWriter.add(path, new zip.BlobReader(file), function() {
                
                addIndex++;
                if (addIndex < files.length)
                  nextFile(obj);
                else
                  onend();
              }, onprogress);
            }
          } else {
            path = path + n + '/';
            obj.zipWriter.add(path, null, () => {
              
              onend();
            }, onprogress, { directory: true });
          }
        }
      }
      
    }

    function createZipWriter(obj) {
      zip.createWriter(obj.writer, function(writer) {
        obj.zipWriter = writer;
        oninit();
        nextFile(obj);
      }, onerror);
    }

    if (this.zipWriter)
      nextFile(this);
    else if (this.creationMethod == "Blob") {
      this.writer = new zip.BlobWriter();
      createZipWriter(this);
    } else {
      this.createTempFile( (fileEntry) => {
        this.zipFileEntry = fileEntry;
        this.writer = new zip.FileWriter(this.zipFileEntry);
        createZipWriter(this);
      });
    }
  }

  getBlobURL(callback) {
    this.zipWriter.close((blob) => {
      var blobURL = this.creationMethod == "Blob" ? URL.createObjectURL(blob) : this.zipFileEntry.toURL();
      callback(blobURL);
    });
  }
  getBlob (callback) {
    this.zipWriter.close(callback);
  }

  
  //requestFileSystem ;
  
  onerror(message) {
    alert(message);
  }

  createTempFile(callback) {
    var tmpFilename = "tmp1.zip";
    this.requestFileSystem(window.TEMPORARY, 4 * 1024 * 1024 * 1024, function(filesystem) {
      function create() {
        filesystem.root.getFile(tmpFilename, {
          create : true
        }, function(zipFile) {
          callback(zipFile);
        });
      }

      filesystem.root.getFile(tmpFilename, null, function(entry) {
        entry.remove(create, create);
      }, create);
    });
  }
}

