/* eslint-disable */
const express= require("express")
const app = express()
const morgan = require("morgan")
// const parser = require("body-parser")
const socketio = require("socket.io")
const fetch = require("sync-fetch")
//const tflops = require("./tflops")
app.port = process.env.PORT || 3001

var server = app.listen(app.port, ()=> console.log(`server port ${app.port}`))

app.use(express.json())
app.use(morgan("dev"))

// Precaucion settea el header de staticos en recibir peticiones https automaticamente (hsts)
// Si pasa el error Empty Response quitar el segundo argumento de express.static para solo tener 1 original

app.use(express.static("routes"))

//Leer comentario si pasa el error Empty reponse

// Segunda nota Ha sido eliminado el segundo argumento 
/*  , {setHeaders: function(res, path) {
        res.set("Strict-Transport-Security",'max-age=63072000')
      }
    } **/


    
io=socketio(server)
notiftopics=["orders_v2","shipments","questions","messages", "claims" ]
let requ={}
function getnotiftopic(requ){
    data=fetch("https://thenotifier0.firebaseio.com/notifpreferences.json")
    if(data.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"getting notifpreferences got "+ data.status + " status."}})
    }else if(data.status==200){
        data=data.json()
        notiftopics=data
    }
}
//getnotiftopic()
console.log("topicos", notiftopics)
/*
if(!fs.existsSync("routes/queue.json")) {
    fs.writeFileSync("routes/queue.json", JSON.stringify({}, null, 2))
  }

  if(!fs.existsSync("routes/historier.json")) {
    fs.writeFileSync("routes/historier.json", JSON.stringify({}, null, 2))
  }*/

function gettime(){
    today=new Date();
    hour=today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    date=new Date().toLocaleDateString("co-CO")+"T"+hour

    return date;


}
app.get("/debug/benchmark", (req, res)=>{
    benchmark=tflops()
    res.send(benchmark)
})

app.get("/historier", (req, res)=>{
    data=fetch("https://thenotifier0.firebaseio.com/historier.json?print=pretty")
    if(data.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"getting historier got "+ requ.status + " status."}})
    }
    data=data.json()

    res.send("<body Style='background-color:#13182aff'><h1 Style='font-family:sans-serif; color:white; text-align:center; margin-bottom:0px; font-size:25.6px;'>Historier</h1> <hr style='width:60%;'> <pre id='json' Style='font-family:sans-serif; color:white; font-size:20.8px;text-align:left;'>"+(JSON.stringify(data, null, 3)+"</pre></body>"))

    //res.json(his)
})

app.get("/queue", (req, res)=>{
    data=fetch("https://thenotifier0.firebaseio.com/queue.json?print=pretty")
    if(data.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"getting queue got "+ requ.status + " status."}})
    }
    data=data.json()
    res.send("<body Style='background-color:#13182aff'><h1 Style='font-family:sans-serif; color:white;  text-align:center; margin-bottom:0px;margin-top:15px; font-size:25.6px;'>Queue</h1> <hr style='width:60%;'> <pre id='json' Style='font-family:sans-serif; color:white; font-size:20.8px; text-align:left;'>"+(JSON.stringify(data, null, 3)+"</pre></body>"))

    //res.json(queue)
})

app.post("/emailernotif", (req, res) =>{
    res.send({"Status":"200"})
    console.log( req.body, req.headers)

    bodreal=req.body
    if (bodreal["securekey"]!= (!process.env.securekey ? "apj5x9p3*" : process.env.securekey)){
        console.log("NO KEY CAN BE A ATTACK===============================================")
        return
    }else{
        delete bodreal["securekey"]
        delete req.body["securekey"]

    }

    
    if (Object.keys(io.sockets.sockets).length >0){
        let bod=bodreal
        emailid=Object.values(bod)
        bod["title"]="Email " +  emailid[0] + " notification"
		bod.options={"iconname":"emailnotif.ico"}
        bod.options.body="the email "+ emailid[0]+"'s been seen\n\n " + "date: "+Object.keys(bod)[0]
        io.sockets.emit("notify", bod) //{title:"new data added", "options":JSON.stringify(bod)}
    }else{
        bodreal[Object.keys(bodreal)]={id:bodreal[Object.keys(bodreal)], type:"Emailnotif"}
        requ=fetch("https://thenotifier0.firebaseio.com/queue.json",{
            method: 'patch',
            body:    JSON.stringify(bodreal),
            headers: { 'Content-Type': 'application/json' },
        })
        if(requ.status!=200){
            io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
        }

        console.log("req queue",requ.json(), "his", bodreal)


    }


})

app.get("/notifier", (req, res) => {
    console.log( req.body, req.headers)
    bod=req.body
    // his=fetch('https://thenotifier0.firebaseio.com/historier.json?orderBy="$key"&limitToLast=121&print=pretty').json()
    his={}


    //historierfile=fs.readFileSync("routes/historier.json")
    //queuefile=fs.readFileSync("routes/queue.json")

    // queue=fetch("https://thenotifier0.firebaseio.com/queue.json").json()

    queue={}

    //his=JSON.parse(historierfile)
    //queue=JSON.parse(queuefile)

    date=(!!bod.sent ? bod.sent : gettime())
    while(date.indexOf("/")!=-1){
        date=date.replace("/", "-")
    }
    while(date.indexOf(":")!=-1){
        date=date.replace(":", "-")
    }
    while(date.indexOf(".")!=-1){
        date=date.replace(".", "-")
    }

    his[date]=bod

    if (Object.keys(io.sockets.sockets).length >0){
        io.sockets.emit("notify", bod) //{title:"new data added", "options":JSON.stringify(bod)}
    }else{
        queue[date]=bod
        requ=fetch("https://thenotifier0.firebaseio.com/queue.json",{
            method: 'patch',
            body:    JSON.stringify(queue),
            headers: { 'Content-Type': 'application/json' },
        })
        if(requ.status!=200){
            io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
        }



    }
    requ=fetch('https://thenotifier0.firebaseio.com/historier.json',{
        method: 'patch',
        body:    JSON.stringify(his),
        headers: { 'Content-Type': 'application/json' },
    } )

    if(requ.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving historier got "+ requ.status + " status."}})
    }

    //fs.writeFileSync("routes/queue.json", JSON.stringify(queue, null, 2))
    //io.sockets.emit("alert", "new data added")

    res.send({
        "res":true,
        "his":his
    })

    
})

app.post("/notifier", (req, res) => {
    res.sendStatus(200)
    console.log("no Skipped $log1")
    console.log( req.body, req.headers)
    bod=req.body
    // his=fetch('https://thenotifier0.firebaseio.com/historier.json?orderBy="$key"&limitToLast=121&print=pretty').json()
    his={}


    //historierfile=fs.readFileSync("routes/historier.json")
    //queuefile=fs.readFileSync("routes/queue.json")

    // queue=fetch("https://thenotifier0.firebaseio.com/queue.json").json()
    queue={}

    //his=JSON.parse(historierfile)
    //queue=JSON.parse(queuefile)

    date=(!!bod.sent ? bod.sent : gettime())
    while(date.indexOf("/")!=-1){
        date=date.replace("/", "-")
    }
    while(date.indexOf(":")!=-1){
        date=date.replace(":", "-")
    }
    while(date.indexOf(".")!=-1){
        date=date.replace(".", "-")
    }

    his[ date]=bod
	console.log("$entering topics cond", "cond", notiftopics.indexOf(bod.topic)!=-1, "notiftopics", notiftopics, "bod.topic", bod.topic, "bod keys", Object.keys(bod))
    if (notiftopics.indexOf(bod.topic)!=-1){
    	console.log("$emitnotify entry 1")
        if (Object.keys(io.sockets.sockets).length >0){
			console.log("$emitnotify pass cond", bod)
			
            io.sockets.emit("notify", bod) //{title:"new data added", "options":JSON.stringify(bod)}
        }else{
            queue[date]=bod
            requ=fetch("https://thenotifier0.firebaseio.com/queue.json",{
                method: 'patch',
                body:    JSON.stringify(queue),
                headers: { 'Content-Type': 'application/json' },
            })
            if(requ.status!=200){
                io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
            }

            console.log("req queue",requ.json(), "his", his)


        }
    }
    requ=fetch('https://thenotifier0.firebaseio.com/historier.json',{
        method: 'patch',
        body:    JSON.stringify(his),
        headers: { 'Content-Type': 'application/json' },
    } )
    if(requ.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving historier got "+ requ.status + " status."}})
    }

    console.log("req",requ.json(), "his", his)
    //fs.writeFileSync("routes/queue.json", JSON.stringify(queue, null, 2))
    //io.sockets.emit("alert", "new data added")
    /*
    res.send({
        "res":true,
        "his":his
    })*/

    
})

app.post("/", (req, res) => {
    console.log( req.body, req.headers)
    bod=req.body
    // his=fetch('https://thenotifier0.firebaseio.com/historier.json?orderBy="$key"&limitToLast=121&print=pretty').json()
    his={}


    //historierfile=fs.readFileSync("routes/historier.json")
    //queuefile=fs.readFileSync("routes/queue.json")

    // queue=fetch("https://thenotifier0.firebaseio.com/queue.json").json()
    queue={}

    //his=JSON.parse(historierfile)
    //queue=JSON.parse(queuefile)

    date=(!!bod.sent ? bod.sent : gettime())
    while(date.indexOf("/")!=-1){
        date=date.replace("/", "-")
    }
    while(date.indexOf(":")!=-1){
        date=date.replace(":", "-")
    }
    while(date.indexOf(".")!=-1){
        date=date.replace(".", "-")
    }

    
    his[date]=bod

    if (Object.keys(io.sockets.sockets).length >0){
        io.sockets.emit("notify", bod) //{title:"new data added", "options":JSON.stringify(bod)}
    }else{
        queue[date]=bod
        requ=fetch("https://thenotifier0.firebaseio.com/queue.json",{
            method: 'put',
            body:    JSON.stringify(queue),
            headers: { 'Content-Type': 'application/json' },
        })
        if(requ.status!=200){
            io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving queue got "+ requ.status + " status."}})
        }



    }
    requ=fetch('https://thenotifier0.firebaseio.com/historier.json',{
        method: 'patch',
        body:    JSON.stringify(his),
        headers: { 'Content-Type': 'application/json' },
    } )
    if(requ.status!=200){
        io.sockets.emit("notify", {title:"Something went wrong", options:{body:"Saving historier got "+ requ.status + " status."}})
    }

    //fs.writeFileSync("routes/queue.json", JSON.stringify(queue, null, 2))
    //io.sockets.emit("alert", "new data added")

    res.send({
        "res":true,
        "his":his
    })

    
})


/**
app.use("/prunotif", require("./routes/index.js"))
app.post("/notifier", (req, res) => {
    console.log( req.body, req.headers)
    bod=req.body
    historierfile=fs.readFileSync("routes/historier.json")
    his=JSON.parse(historierfile)
    his={...his, ...bod}
    fs.writeFileSync("routes/historier.json", JSON.stringify(his, null, 2))
    res.send({
        "res":true
    })
    
})*/


io.on("connection", (socket) => {
    console.log("conectado Id" + socket.id)
    io.sockets.emit("log", "connected")
    //console.log("alerted")

    /*queuefile=fs.readFileSync("routes/queue.json")
    queue=JSON.parse(queuefile)*/

    queue=fetch("https://thenotifier0.firebaseio.com/queue.json").json()


    

    for (noti of Object.keys(queue)){
        if (noti==="placeholder"){
            continue
        }
        if(noti.indexOf("*")!=-1){
            bod=queue[noti]
            
            emailid=bod["id"]

            delete bod["type"]
            bod["title"]="Email " +  emailid + " notification"
            bod.options={"iconname":"emailnotif.ico"}
            bod.options.body="the email "+ emailid+"'s been seen\n\n " + "date: "+noti
            io.sockets.emit("notify", bod) //{title:"new data added", "options":JSON.stringify(bod)}
    
        }else{
            io.sockets.emit("notify", queue[noti])
        }
        delete queue[noti]
    }

    req=fetch("https://thenotifier0.firebaseio.com/queue.json",{
        method: 'put',
        body:    JSON.stringify(queue),
        headers: { 'Content-Type': 'application/json' },
    } )

    
    socket.on("notify", (data) => {
        io.sockets.emit("notify", data)
        console.log("notified")
    })
}) 

