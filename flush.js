const bluebird = require("bluebird");
const redis = require("redis");


bluebird.promisifyAll(redis);

// Starts our Redis client
const client = redis.createClient();

const main = async () => {
    try {
        let result = await client.flushallAsync();
        console.log("Flushed ram success")
        console.log(result)
    }
    catch(error){
        console.log("Could not flush RAM");
        console.log(error);
    }
}

main();