var request = require("request");
const fs = require('fs');
const https = require('https')

module.exports.download_from_s3 = function (transaction_id, file_location, cb) {
  //download all inputs from S3 to transaction folders
  console.log(file_location);
  const options = {
      url: global.s3_upload_presigned_url,
      method: 'POST',
      body: {
          'type': 'get',
          'filename': global.companyid + '/' + global.servingprojectid + '/' + file_location,
          'secret_key': global.secret_key
      },
      headers: {
          'Content-Type': 'application/json'
      },
      json:true
  };

  request(options,(err, response, body) => {
      if(!err && response.statusCode == 200 && body['urls'] && body['urls'].length > 0) {
          const url = body['urls'][0];
          var path = __dirname + "/uploads/" + file_location;
          var directory = __dirname + "/uploads/" + transaction_id + "/inputs"
          //create uploads folder and transaction id folder if it doesnt exist
          if(!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
          }

          const file = fs.createWriteStream(path)

          var request = https.get(url, function(response) {
            response.pipe(file);
            file.on('finish', function() {
              file.close(cb(null, path));  // close() is async, call cb after close completes.
            });
          }).on('error', function(err) { // Handle errors
            fs.unlink(path); // Delete the file async. (But we don't check the result)
            if (cb) cb(err.message, null);
          });
          
      } else {
          console.log(err);
          console.log(options);
          return cb(err, null);
      }
  });
}

module.exports.download_from_url = function (transaction_id, file_location, cb) {
  //download all inputs from S3 to transaction folders
  cb();
}