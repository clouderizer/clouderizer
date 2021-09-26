module.exports.socket_handler = function (socket, event, data, cb) {
    console.log("Event emitting", event, data);
    socket.emit(event, data);
    global.java_client_status = false;

    socket.on(event+"_ack", (d) => {
        // savedRes.status(200).json(data);
        // cb(d);
        console.log(global.task_queue);
        global.task_queue.shift();
        global.java_client_status = true;

        // if(global.task_queue.length>0) {
        //     this.socket_handler(socket, event, global.task_queue[0].csv);
        // }

        cb(null, d);
    });

    socket.on(event+"_err", () => {
        console.log("The prediction took more than 10 sec. Which is unlikely!");
        cb("Error", null);
    });

    socket.setTimeout(3000);

    socket.on('timeout', () => {
    console.log('socket timeout');
    socket.end();
    });
}

function unixSocketWithTimeout() {
    return setTimeout(() => {

    });
}

module.exports.exit_sequence= function(unixSocket) {
    var buf = Buffer.from(JSON.stringify({"exit":true}));
    unixSocket.write(buf);
} 

module.exports.python_socket = function (unixSocket, valueToSend, cb) {

    // unixSocket.on("data", (data) => {
    //     console.log(data.length);
    //     console.log("data received");
    //     // console.log(data.toString());

    //     dataString += data.toString();
    //     console.log(dataString.length);
    //     var a = stripEndQuotes(dataString).split('||||')[0];
    //     var b = stripEndQuotes(dataString).split('||||')[1];

    //     console.log(a)
    //     console.log(Number(a))
    //     console.log(b.length);
    //     // console.log(b)
    //     if(a && b){
    //         if(b.length == Number(a)) {
    //             unixSocket.removeListener('timeout', handleTimeout);
    //             b = b.replace(/'/g, '"')
    //             return cb(null, b);
    //         }
    //     }
            
    // });

    var buf = Buffer.from(JSON.stringify(valueToSend)); 
    console.log(valueToSend);
    var dataString = "";
    var datatemp=[];
    try {
        unixSocket.write(buf);

    } catch(err) {
        console.log(err);
        return cb(err,null);
    }

    unixSocket.setTimeout(50000);

    handleTimeout = () => {
        console.log("Unix Socket timed out!");
        return cb("No response from model predictor", null); 
    }

    dataevent = (data) => {
        console.log(data.length);
        console.log("data received");
        
        dataString += data.toString();
        console.log(dataString.length);
        console.log(dataString);
        datatemp = stripEndQuotes(dataString).split('4ebd0208-8328-5d69-8c44-ec50939c0967');
        console.log(datatemp);

        if(datatemp[datatemp.length-1] == "") {
            unixSocket.removeListener('timeout', handleTimeout);
            unixSocket.removeListener('data', dataevent);
            var finaldata = datatemp[datatemp.length-2].replace(/'/g, '"');
            dataString = "";
            return cb(null, finaldata);
        } 
        else{
            console.log("data is still arriving");
        }     
    }

    unixSocket.once('timeout', handleTimeout);

    unixSocket.on("data", dataevent);
}

module.exports.java_socket = function (unixSocket, valueToSend, cb) {
    var buf = Buffer.from(JSON.stringify(valueToSend)); 
    var dataString = "";

    try {
        unixSocket.write(buf);
    } catch(err) {
        console.log(err);
        return cb(err,null);
    }
    
    unixSocket.setTimeout(50000);

    handleTimeout = () => {
        console.log("Unix Socket timed out!");
        cb("No response from model predictor", null); 
    }

    unixSocket.once('timeout', handleTimeout);

    unixSocket.once("data", (data) => {
        console.log(data.length);
        console.log("data received");
        // console.log(data.toString());
        unixSocket.removeListener('timeout', handleTimeout);
        cb(null, data.toString());
        
    });
}

module.exports.python_socket_easy = function (unixSocket, valueToSend, cb) {
    var buf = Buffer.from(JSON.stringify(valueToSend)); 
    console.log(valueToSend);
    var dataString = "";
    var datatemp=[];
    try {
        unixSocket.write(buf);

    } catch(err) {
        console.log(err);
        return cb(err,null);
    }

    unixSocket.setTimeout(60 * 60 * 1000);

    handleTimeout = () => {
        console.log("Unix Socket timed out!");
        return cb("Response time out", null); 
    }

    dataevent = (data) => {
        console.log(data.length);
        console.log("data received");
        
        dataString += data.toString();
        console.log(dataString.length);
        console.log(dataString);
        datatemp = stripEndQuotes(dataString).split('4ebd0208-8328-5d69-8c44-ec50939c0967');
        console.log(datatemp);

        if(datatemp[datatemp.length-1] == "") {
            unixSocket.removeListener('timeout', handleTimeout);
            unixSocket.removeListener('data', dataevent);
            var finaldata = datatemp[datatemp.length-2].replace(/'/g, '"');
            dataString = "";
            return cb(null, finaldata);
        } 
        else{
            console.log("data is still arriving");
        }     
    }

    unixSocket.once('timeout', handleTimeout);

    unixSocket.on("data", dataevent);
}

function stripEndQuotes(s){
	var t=s.length;
	if (s.charAt(0) == '"') s=s.substring(1,t--);
	if (s.charAt(--t) == '"') s=s.substring(0,t);
	return s;
}
