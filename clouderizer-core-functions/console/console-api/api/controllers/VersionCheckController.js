const fs = require('fs');
const path = require("path");

module.exports = {
    versionCheck: function(req, res) {
        fs.readFile(path.resolve(__dirname, "./../../assets/public/assets/versionCheck.json"), 'utf-8', (err, data) => {
            if (err || !data) {
                console.log(err);
                return res.status(500).json({msg:"Could not fetch build version"});
            }
            else if(data){
                console.log(data);
                let versionjson = JSON.parse(data)
                console.log(versionjson);
                return res.status(200).json( versionjson);
            }
        });
    }
  }