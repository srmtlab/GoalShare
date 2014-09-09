/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var user = require('./routes/user');
var http = require('http');
var path = require('path');
var socket = require("socket.io")({resource: '/gsneg/socket.io'});
var $ = require('jquery');

var app = express();

// all environments
app.set('port', process.env.PORT || 33000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
// development only
if ('development' == app.get('env')) {
	app.use(express.errorHandler());
}

app.use(function(req, res, next) {
    var matchUrl = '/apps';
    if(req.url.substring(0, matchUrl.length) === matchUrl) {
      res.setHeader("Access-Control-Allow-Origin", "*");
    }
    return next();
  });

// public static files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/apps', express.static(path.join(__dirname, 'apps')));

app.get('/', routes.index);
app.get('/users', user.list);

// Easy string formatting
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{\{|\}\}|\{(\d+)\}/g, function (m, n) {
    if (m == "{{") { return "{"; }
    if (m == "}}") { return "}"; }
    return args[n];
  });
};

var server = http.createServer(app);

// Open 
server.listen(app.get('port'), function(){
	console.log('Express server listening on port ' + app.get('port'));
});

// Store the state in memory array
var negotiations ={
 sessions: {},
 testState: function(id) {
	if ( !negotiations.sessions[id]  ) {
		session = ({
			id: id
		});
		session.state = {
			notes: "[]",
			connections: "[]",
			state: "0",
			topic: "",
			desc: "",
			deletedNotes: "[]",
			mergedNotes: "[]",
			savedStates: "[]",
			lTree: "",
			rTree: ""};
		negotiations.sessions[id] = session;
	}
}

};


//socket.io
var io = socket.listen(server);//, { 'destroy upgrade': false });
io.on('connection', function(client){
	
	console.log("connected");
	client.on('event', function(data){
		  console.log("data" + data);
		  
	  });


client.on('session', function(dataStr, fn){
	console.log("In session.");
	
	var data = {};
	try {
		data = JSON.parse(dataStr);
	} catch(e) {
		
		
	}
	if(data.id){
		client.join(data.id)
	}
	if(data.command == 'join'){
		client.join(data.id)
		fn("Joined");
	}
	if(data.command == 'leave'){
		client.leave(data.id)
		fn("Leaved");
	}
	if(data.command == 'message'){
		negotiations.testState(data.id);
		client.broadcast.to(data.id).emit("message", data.message)
		fn("For: " + data.id + " Message: " + data.message);
	}
	
	if(data.command == 'list'){		
		fn(JSON.stringify( Object.keys( negotiations.sessions ) ) );
	}
   
	if(data.command == 'getState'){
		// If requesting non existing session -> Create one
		negotiations.testState(data.id);
		var state = negotiations.sessions[data.id].state;
		fn( JSON.stringify( state ) );
	}
	if(data.command == 'setState'){
		negotiations.testState(data.id);
		var state = JSON.parse(data.state);
		negotiations.sessions[data.id].state = state;
	}
	if(data.command == 'getValue'){
		negotiations.testState(data.id);
		fn(negotiations.sessions[data.id].state[data.key]);
	}
	if(data.command == 'setValue'){
		
		negotiations.sessions[data.id].state[data.key] = data.value;
		client.broadcast.to(data.id).emit("state",  JSON.stringify( negotiations.sessions[data.id].state ));
		fn("{0} set to {1}".format(data.key, JSON.stringify( negotiations.sessions[data.id].state ) ) );
	}
	//io.sockets.in(data.id).emit("state", session.state);
	console.log("End.")
	//table.startSession();
	});
client.on('message:', function(data, fn){
 //fn("Hei " + Date.getSeconds());
});
	client.on('disconnect', function(){
		  console.log("Discon");
	  });	  
});