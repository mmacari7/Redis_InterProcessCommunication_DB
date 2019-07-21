// Michael Macari
// Axios for getting dummy data from url
const axios = require("axios");
const bluebird = require("bluebird");
const redis = require("redis");

// Command to promisify redis functions to be anync
bluebird.promisifyAll(redis);

// Creates our redis client
const client = redis.createClient();

// Gets our redis configuration connection from parent directory
const redisConnection = require("../redis-connection");

const dummyURL = "https://gist.githubusercontent.com/philbarresi/5cf15393d245b38a2d86ce8207d5076c/raw/d529fb474c1af347702ca4d7b992256237fa2819/lab5.json"


// Main function async, so we can do all redis async and download our data for manipulation
async function main(){
    // Download our data from the URL
    let axRet = await axios.get(dummyURL);
    let users = axRet.data;

    // Redis event for get user by ID
    // GET /api/people/:id
    redisConnection.on('get-user-by-id:request:*', async (message, channel) => {
        let requestId = message.requestId;
        let eventName = message.eventName;
      
        let messageText = message.data.message;
        let successEvent = `${eventName}:success:${requestId}`;
        let failedEvent = `${eventName}:failed:${requestId}`

        let id = parseInt(messageText);

        // If the id is invalid, we send a failed event
        if(isNaN(id) || id <= 0 || id > users.length) {
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Invalid ID"}
            })
        }


        let person = {}

        // Search for the person in the downloaded data
        for(let i=0; i < users.length; i++) {
            if(String(users[i].id) === messageText){
                person = users[i]
                break
            }
        }
        // Emit success event
        redisConnection.emit(successEvent, {
          requestId: requestId,
          data: person,
          eventName: eventName
        });
    })





}

main()
console.log("Worker is running...")



// redisConnection.on('get-user-by-id:request:*', async (message, channel) => {
//     let requestId = message.requestId;
//     let eventName = message.eventName;
  
//     let messageText = message.data.message;
//     let successEvent = `${eventName}:success:${requestId}`;
    
//     console.log(messageText);

//     let person = {"Hello": "28"}
//     // for(let i=0; i < users.length; i++) {
//     //     if(str(users[i].id) === messageText){
//     //         person = users[i]
//     //         break
//     //     }
//     // }


//     redisConnection.emit(successEvent, {
//       requestId: requestId,
//       data: person,
//       eventName: eventName
//     });
// })