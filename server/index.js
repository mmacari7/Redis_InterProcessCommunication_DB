const express = require("express");
const app = express();
const redisConnection = require("../redis-connection");
const nrpSender = require("../nrp-sender-shim");
const bodyParser = require("body-parser");

app.use(bodyParser.json());

app.get("/api/people/:id", async (req, res) => {
    
    let id = req.params.id;

    // Try sending the request
    try{
        let response = await nrpSender.sendMessage({
            redis: redisConnection,
            eventName: "get-user-by-id",
            data: {message: id},
            expectsResponse: true
        })
        // Output the response
        res.json(response);
    }
    catch(e){
        // If failed event we output the response from failed event
        res.json(e);
    }

    


})



app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
});
  