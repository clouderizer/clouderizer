var socketAckService = require("./socketAckService");


module.exports.pushCommand = function(socket, command, params, project_key, cb) {
  console.log(command+ " sent.");
  socket.emit(command, params);
  
  // Once ack is received we will update the state of the machine
  socket.on(command + '_ack', (resp) => {
    console.log(command + ' Ack received.');
    var callback = socketAckService.removeAckHandler(project_key, command + '_ack', cb);
    console.log(callback);
    if(callback!=null) {
      callback(null, resp);
    }
  });

  socketAckService.saveAckHandler(project_key, command + '_ack', cb);
}