
module.exports.saveAckHandler = function(project_key, ack_name, cb) {
        sails.config.clouderizerconfig.globalAckList.push({project_key:project_key,name: ack_name, callback: cb});
        console.log('save ' + ack_name, sails.config.clouderizerconfig.globalAckList);
}

module.exports.removeAckHandler = function (project_key, ack_name, cb) {
    if(sails.config.clouderizerconfig.globalAckList.length>0) {
        var count=0;
        for(var i=0;i<sails.config.clouderizerconfig.globalAckList.length; i++) {
            count=count+1;
            if(sails.config.clouderizerconfig.globalAckList[i].name === ack_name && 
                sails.config.clouderizerconfig.globalAckList[i].project_key === project_key && 
                sails.config.clouderizerconfig.globalAckList[i].callback === cb) {
                sails.config.clouderizerconfig.globalAckList.splice(i,1);
                return cb;
            }

            if(sails.config.clouderizerconfig.globalAckList.length===count) {
                return null;
            }
        }

        if(ack_name.includes("_ack")) {
            console.log('removed ' + ack_name , sails.config.clouderizerconfig.globalAckList);
        }
    } else return null;
}

module.exports.registerAllAcks = function (socket, project_key) {
    console.log('register',sails.config.clouderizerconfig.globalAckList);
    console.log("Attaching all event listeners");
    if(sails.config.clouderizerconfig.globalAckList.length>0) {
        for(var i=0;i<sails.config.clouderizerconfig.globalAckList.length;i++) {
            var ack = sails.config.clouderizerconfig.globalAckList[i];
            if(ack.project_key == project_key) {
                socket.on(sails.config.clouderizerconfig.globalAckList[i].name, 
                    sails.config.clouderizerconfig.globalAckList[i].callback);
            }
        }
    }
}