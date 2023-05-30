const express = require("express")
const app = express()
const morgan = require("morgan")
// const parser = require("body-parser")
const socketio = require("socket.io")
const fetch = require("sync-fetch")
//const tflops = require("./tflops")
app.port = process.env.PORT || 3001

var server = app.listen(app.port, () => console.log(`server port ${app.port}`))

app.use(express.json())
app.use(morgan("dev"))

// Precaucion settea el header de staticos en recibir peticiones https automaticamente (hsts)
// Si pasa el error Empty Response quitar el segundo argumento de express.static para solo tener 1 original

app.use(express.static("routes"))

io=socketio(server)

//gets date
function getCurrentTime() {
	today=new Date();
    hour=today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    date=new Date().toLocaleDateString("co-CO")+"T"+hour

	while (date.indexOf("/") != -1) {
		date = date.replace("/", "-")
	}
	while (date.indexOf(":") != -1) {
		date = date.replace(":", "-")
	}
	while (date.indexOf(".") != -1) {
		date = date.replace(".", "-")
	}
	return date
}

/* requ=fetch("https://thenotifier0.firebaseio.com/queue.json",{
				method: 'patch',
				body:    JSON.stringify(queue),
				headers: { 'Content-Type': 'application/json' },
			})
			if(requ.status!=200){
				io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
			}
 */

/*

messagehistory= {
	timestamp:{SenderName:"Name",
	Message:"textsent",
	socketioid:"socketioid"}
}
*/
let messageHistory = fetch("https://chatwebapp-4jf59-default-rtdb.firebaseio.com/messageHistory.json").json()

app.get("/messagehistory", (req, res) => {
	res.json(messageHistory)
})


// if (requ.status != 200) {
// 	io.sockets.emit("notify", { title: "Something went wrong", options: { body: "Saving queue got " + requ.status + " status." } })
// }
io.on("connection", (socket) => {
	console.log("newconnection", "socket")

	socket.on("getChatHistory", (data) => {
		console.log("chathistory fetched", messageHistory)
		socket.emit("runOnceDevLoad", messageHistory)

	})
	socket.on("sendMessage", (data) => {
		// data={senderName, messageContent}
		timestamp = getCurrentTime()
		let message = {}
		Object.keys(data).forEach((timestampr) => {
			console.log("indawdi", data, timestampr)
			// messageHistory[timestamp] = data[timestampr]
			messageHistory={...messageHistory, ...data}
			message[timestamp] = data[timestampr]})

		requ = fetch("https://chatwebapp-4jf59-default-rtdb.firebaseio.com/messageHistory.json", {
			method: 'patch',
			body: JSON.stringify(data),
			headers: { 'Content-Type': 'application/json' },
		})
		// if(requ.status!=200){
		// 	io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
		// }
		console.log("new message emitted " + message, data)
		
		socket.broadcast.emit("newMessage", data)
	})
})