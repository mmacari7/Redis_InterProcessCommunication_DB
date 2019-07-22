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
        let failedEvent = `${eventName}:failed:${requestId}`;

        let id = parseInt(messageText);

        // If the id is invalid, we send a failed event
        if(isNaN(id) || id <= 0) {
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
        
        // If person is an empty object after search, person with ID was not found, so we emit the failed event
        if(Object.keys(person).length === 0 && person.constructor === Object){
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Person with that ID does not exist"}
            })
            return;
        }

        // Emit success event
        redisConnection.emit(successEvent, {
          requestId: requestId,
          data: person,
          eventName: eventName
        });
    })

    redisConnection.on('create-user:request:*', async (message, channel) => {
        let requestId = message.requestId;
        let eventName = message.eventName;
      
        let messageText = message.data.message;
        let successEvent = `${eventName}:success:${requestId}`;
        let failedEvent = `${eventName}:failed:${requestId}`;

        // Validate that the object being created is valid with correct properties
        let keysRequired = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address']
        for(let i=0; i < keysRequired.length; i++){
            // If the object being passed does not contain a key in the list
            if(!messageText.hasOwnProperty(keysRequired[i])){
                // Emit failed event
                redisConnection.emit(failedEvent, {
                    requestId,
                    eventName,
                    data: {message: "Error: Missing fields"}
                })
                return;
            }
        }

        // Iterate through the keys in the object
        for(let key in messageText){
            // If any of the keys arent in the required list, we emit a failed event
            if(!keysRequired.includes(key)){
                // Emit failed event
                redisConnection.emit(failedEvent, {
                    requestId,
                    eventName,
                    data: {message: "Error: Additional Fields"}
                })
                return;
            }

            // Check that the id field is a valid ID
            if(key === 'id'){
                // If the ID field is not a number, or the ID field is less than 0, we emit a failed event
                if(isNaN(parseInt(messageText[key])) || parseInt(messageText[key]) <= 0){
                    redisConnection.emit(failedEvent, {
                        requestId,
                        eventName,
                        data: {message: "Error: ID is not valid, must be a number and greater than 0"}
                    })
                    return;
                }
            }
            // Check that all remaining fields are strings
            else {
                if(typeof messageText[key] !== 'string'){
                    redisConnection.emit(failedEvent, {
                        requestId,
                        eventName,
                        data: {message: "Error: All fields that are not ID need to be a string"}
                    })
                    return;
                }
            }
        }

        // Last check to make sure ID is not already in DB
        for(let i=0; i < users.length; i++){
            if(users[i].id == messageText.id){
                redisConnection.emit(failedEvent, {
                    requestId,
                    eventName,
                    data: {message: "Error: Person with that ID already exists"}
                })
                return;
            }
        }

        // End of error checking for object properties passed in
        
        // If all error checking passes, then we can add the object to the data base and emit a success event
        users.push(messageText);
        
        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: {"created": messageText},
            eventName: eventName
        });
        return;
    })

    redisConnection.on('delete-user-by-id:request:*', async (message, channel) => {
        let requestId = message.requestId;
        let eventName = message.eventName;
      
        let messageText = message.data.message;
        let successEvent = `${eventName}:success:${requestId}`;
        let failedEvent = `${eventName}:failed:${requestId}`;

        let id = parseInt(messageText);

        // If the id is invalid, we send a failed event
        if(isNaN(id) || id <= 0) {
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Invalid ID"}
            })
            return;
        }

        let index;
        let person = {}
        // Search for the person in the downloaded data
        for(let i=0; i < users.length; i++) {
            if(String(users[i].id) === messageText){
                index = i;
                person = users[i]
                break
            }
        }
        
        // If person is an empty object after search, person with ID was not found, so we emit the failed event
        if(Object.keys(person).length === 0 && person.constructor === Object){
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Person with that ID does not exist"}
            })
            return;
        }

        if(index){
            users.splice(index, 1)
        }

        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: {"deleted": person},
            eventName: eventName
        });
        return;

    })

    redisConnection.on('update-user-by-id:request:*', async (message, channel) => {
        let requestId = message.requestId;
        let eventName = message.eventName;
      
        let messageText = message.data.message;
        let successEvent = `${eventName}:success:${requestId}`;
        let failedEvent = `${eventName}:failed:${requestId}`;

        let updates = message.data.updates;
        let id = parseInt(messageText);

        // If the id is invalid, we send a failed event
        if(isNaN(id) || id <= 0) {
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Invalid ID"}
            })
            return;
        }

        let index;
        let person = {}
        // Search for the person in the downloaded data
        for(let i=0; i < users.length; i++) {
            if(String(users[i].id) === messageText){
                index = i;
                person = users[i]
                break
            }
        }
        
        // If person is an empty object after search, person with ID was not found, so we emit the failed event
        if(Object.keys(person).length === 0 && person.constructor === Object){
            redisConnection.emit(failedEvent, {
                requestId,
                eventName,
                data: {message: "Person with that ID does not exist"}
            })
            return;
        }

        // Validate that the object being created is valid with correct properties
        let keysRequired = ['id', 'first_name', 'last_name', 'email', 'gender', 'ip_address']
        
        // Iterate through the keys in the object
        for(let key in updates){
            // If any of the keys arent in the required list, we emit a failed event
            if(!keysRequired.includes(key)){
                // Emit failed event
                redisConnection.emit(failedEvent, {
                    requestId,
                    eventName,
                    data: {message: "Error: Additional Fields"}
                })
                return;
            }

            // Check that the id field is a valid ID
            if(key === 'id'){
                // If the ID field is not a number, or the ID field is less than 0, we emit a failed event
                if(isNaN(parseInt(updates[key])) || parseInt(updates[key]) <= 0){
                    redisConnection.emit(failedEvent, {
                        requestId,
                        eventName,
                        data: {message: "Error: ID is not valid, must be a number and greater than 0"}
                    })
                    return;
                }
                
                for(let i=0; i < users.length; i++){
                    if(String(updates[key]) == String(users[i][key])){
                        redisConnection.emit(failedEvent, {
                            requestId,
                            eventName,
                            data: {message: "Error: A person in DB with that ID already exists"}
                        })
                        return;
                    }
                }

            }
            // Check that all remaining fields are strings
            else {
                if(typeof updates[key] !== 'string'){
                    redisConnection.emit(failedEvent, {
                        requestId,
                        eventName,
                        data: {message: "Error: All fields that are not ID need to be a string"}
                    })
                    return;
                }
            }
        }

        // Set the fields for the updates passed
        for(let key in updates){
            person[key] = updates[key];
        }

        // Update the user in DB
        users[index] = person;

        // Emit Success Event
        redisConnection.emit(successEvent, {
            requestId: requestId,
            data: {"updated": person},
            eventName: eventName
        });
        return;
    })
}
// Async main
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