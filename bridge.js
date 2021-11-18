//Node-OSC er en pakke, som muliggør OSC kommunikation over serveren 
var osc = require('node-osc');
//SocketIO er en pakke der gør det muligt at oprette "websockets" til realtime kommunikation 
//mellem server og klienter
var io = require('socket.io')(8081);

var oscServer;
let oscClients = [];

var isConnected = false;

/*
  A static file server in node.js.
  Put your static content in a directory next to this file.
  context: node.js
*/

var express = require('express'); // include the express library
var server = express(); // create a server using express
// Serveren lytter efter klienter, altså browser vinduer, på port 8080
server.listen(8080); // listen for HTTP
server.use('/', express.static('client')); // set a static file directory named client
// Det betyder at i den mappe der hedder "/client" der ligger de filer som browsere må se
console.log('Now listening on port 8080');

// Det her er et event. Det sker når en browser har tastet adressen til webserveren (localhost:8080)
io.sockets.on('connection', function (socket) {
	console.log('connection');
	socket.on("config", function (obj) {
		isConnected = true;
		oscServer = new osc.Server(obj.local.port, obj.local.host);
		obj.remotes.map(c => {
			let newClient = new osc.Client(c.host, c.port);
			newClient.send('/status', socket.sessionId + ' connected');
			oscClients.push(newClient);
		});
		oscServer.on('message', function (msg, rinfo) {
			socket.emit("message", msg);
		});
		socket.emit("connected", 1);
	});
    // Her får serveren en tekst besked fra klienten
	socket.on("message", function (obj) {
		console.log("server got message", obj);
        // Tekstbeskeden sendes med OSC til den port output er sat til
		oscClients.map(c => {
			c.send.apply(c, obj);
		});
	});
	socket.on('disconnect', function () {
		if (isConnected) {
			oscServer.kill();
			oscClients.map(c => {
				//c.kill();
			});
		}
	});
});
