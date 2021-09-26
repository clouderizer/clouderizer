const fetch = require('node-fetch');
const request=require('request');
var async = require('async');

module.exports.scheduleServingNodeChecker = async (cb) => {

    var modelDeployStatus=[];
    ServingModel.find({or:[{status:"Running"},{status:"Starting"},{status:"Downloading Model"}]},(err, sm) => {
        if(!err) {
            console.log("Number of projects running:" + String(sm.length));
            for(var i=0;i<sm.length;i++) {
                if(sm[i].status=="Running") {
                    modelDeployStatus.push(new Promise(async (resolve,reject) => {
                        var base_url=sails.config.clouderizerconfig.base_url;
                        var response="",urlToFetch,servingport;
                        var node_base_url="";
                        if(base_url.includes("alpha") || base_url.includes("showcase") || base_url.includes("clouderizer")) {
                            urlToFetch=sails.config.clouderizerconfig.base_url+"/userserving/"+sm[i].servingport+"-"+sm[i].id+"-SH/runtest/"+sm[i].id;
                            node_base_url=sails.config.clouderizerconfig.base_url+"/userserving/"+sm[i].servingport+"-"+sm[i].id+"-SH/"
                            servingport=sm[i].servingport;
                        }

                        if(node_base_url=="") resolve("status uncertain");
                        base_url_re=await fetch(node_base_url);
                        urlBreak=urlToFetch.split("/");
                        servingid=urlBreak[urlBreak.length-1];

                        if(!servingport || servingport=="") {
                            var x= await ServingModel.update({id:servingid},{status:"Not Running",status_message:"Project is offline"}).fetch();
                            await ServingProject.update({id:x[0].servingproject},{status:"Not Running"}).fetch();
                            resolve("Shut down:"+servingid);
                        }

                        console.log(servingid);

                        if(base_url_re.ok) {
                            resolve("Running");
                        } else if((base_url_re.status==502 || base_url_re.status==404)){
                            console.log("updating status of project:"+servingid);
                            var x= await ServingModel.update({id:servingid},{status:"Not Running",status_message:"Project is offline"}).fetch();
                            await ServingProject.update({id:x[0].servingproject},{status:"Not Running"}).fetch();
                            resolve("Shut down:"+servingid);
                        } else {
                            resolve("status uncertain:"+servingid);
                        }
    
                        reject();
                    }));
                } else {
                    var updatedAt=sm[i].updatedAt;
                    var diff = new Date() - updatedAt;
                    
                    timeDiffInMins=diff/(60*1000);

                    if(timeDiffInMins>30) {
                        console.log("Stopping Project!",sm[i].id);
                        ServingModel.update({id:sm[i].id},{status:"Not Running",status_message:"Project Unresponsive! A restart is needed"}).fetch().exec((err,smu)=>{
                            ServingProject.update({id:smu[0].servingproject},{status:"Not Running"}).fetch().exec((err,sp)=>{});
                        });
                    }
                }
            }
        }
        cb();
    });
};