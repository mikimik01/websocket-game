const { Console } = require("console");
const { create } = require("domain");
const http = require("http");
const app = require("express")();
app.get("/", (req, res)=> res.sendFile(__dirname + "/index.html"))
app.listen(9091, () => console.log("Listening on port 9091"))
const WebSocketServer = require("websocket").server;
const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening on 9090"));

// Hashmap to store clients
const clients = {};
const games = {};

const wsServer = new WebSocketServer({
    httpServer: httpServer // Poprawiona nazwa właściwości
});

wsServer.on("request", request => {
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("Connection opened!"));
    connection.on("close", () => console.log("Connection closed"));
    connection.on("message", message => {
        //const result = null;
        //try {
            const result = JSON.parse(message.utf8Data);
        // }
        // catch (e) {
        //     //console.error('Invalid JSON', e);
        //     console.log("Invalid JSON error + ");
        //     console.log(message);
        //     return;
        // }

            
        //Request handling
        if(result.method === "create"){
            const clientId = result.clientId;
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "balls": 20,
                "clients": []
            }
            const payLoad = {
                "method":"create",
                "game": games[gameId]
            }
            const con = clients[clientId].connection;
            con.send(JSON.stringify(payLoad));
        }

        //a client want to join
        if(result.method === "join"){
            //const clientId = result.clientId;
            const gameId = result.gameId;
            const game = games[gameId];
            if(game.clients.length >= 3){
                //sorry max play reached
                return;
            }
            const color = {"0": "Red", "1": "Green", "2": "Blue" }[game.clients.length]
            game.clients.push({
                "clientId": clientId,
                "color": color
            })

            const payLoad = {
                "method": "join",
                "game": game
            }

            //loop all clients and tell them that client has joined
            game.clients.forEach(c => {
                clients[c.clientId].connection.send(JSON.stringify(payLoad))
            });
        }
        
    });

    // Generate a new clientId
    const clientId = guid(); // Upewnij się, że funkcja guid() jest zaimplementowana
    clients[clientId] = {
        connection: connection
    };

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    };
    // Send back the client connect
    connection.send(JSON.stringify(payLoad));
});

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
