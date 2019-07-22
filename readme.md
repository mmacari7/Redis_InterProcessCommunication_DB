## Purpose

The purpose of this program is to demonstrate concurrent usage of node-pub-sub with Redis. Starting the program with `npm start` will cause the program to concurrently run `/server/index.js` and `/worker/index.js`. The worker in this case uses Redis to perform database like functionality "CRUD" opperations. The server runs express with the routes etc. When the user accesses a route, the request is sent to Redis using the `nrp-sender-shim` which tells the worker to perform the operation. Once the operation is completed a pass or fail event is updated, and the server responds accordingly on the route.

## `server/index.js`

This is the server of the program. The server runs concurrently with the worker, and makes use of async await to await the request being sent to the worker for completion.

## `worker/index.js`

This is the worker of the program, performing pub-sub operations using `node-pub-sub`, which allows node to interact with the subscribe publish features in Redis. On start up the worker immediately downloads dummy data from the gist URL and stores it in memory for all the DB like operations to follow.

## Run

To use the program make sure you are in the root project directory. 

Using Node.js run `npm install` to install all of the dependencies. 

Then run `npm start` which will begin concurrently running the server, and the worker. 