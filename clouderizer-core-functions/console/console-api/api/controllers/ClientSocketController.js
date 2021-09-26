module.exports = {
  automlparserlongpoll: function(req, res) {
    if(req.param && req.param('key')=="1234567890") {
      req.socket.join(req.param('key'));

      sails.config.clouderizerconfig.parserSocketId = req.socket.id;
      console.log("Parser Connected");

      sails.config.clouderizerconfig.java_parser_tasks=[];
      res.json("Parser Connected");
      return;
    }
    res.status(500).json( {success: false});
  },

  longpoll : function(req, res) {
    if(req.param) {
      var project_id = req.param('project_id');
      if(project_id) {
        req.socket.join(project_id);
        req.socket.emit('init', 'Socket connected');
        res.ok();  
        return;
      }
    }
    res.status(500).json( { success: false});
  },

  projstatus : function(req, res) {
    if (!req.isSocket) {
      console.log("badrequest");
      return res.badRequest();
    }
    var customer_id = req.body.company;
    if(customer_id) {
      sails.io.sockets.in(customer_id + '_projstatus');
      req.socket.join(customer_id + '_projstatus');
      req.socket.emit('connected', 'Socket connected');
      res.ok();
      return;
    }
    console.log("500 no success");
    res.status(500).json({ success: false});
  },

  publishedprojstatus : function(req, res) {
    if (!req.isSocket) {
      console.log("badrequest");
      return res.badRequest();
    }
    var customer_id = req.body.company;
    if(customer_id) {
      sails.io.sockets.in(customer_id + '_publishedprojstatus');
      req.socket.join(customer_id + '_publishedprojstatus');
      req.socket.emit('connected', 'Socket connected');
      res.ok(); 
      return;
    }
    console.log("500 no success");
    res.json(500, { success: false});
  }
}