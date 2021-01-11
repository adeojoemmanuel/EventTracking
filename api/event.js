'use strict'
const express = require('express')
const app = express()
const event = express.Router()
const AWS = require("aws-sdk");
const joi = require('joi');
const Validator = require('./validator');
const redis = require('redis');

// make a connection to the local instance of redis
const client = redis.createClient(6379);
 

client.on("error", (error) => {
 console.error(error);
});

const eventl = [{
  event_id: 1,
  action_creator: 'Echo',
  receiver: '',
  event_type: '',
  time:'',
  url_from:'',
  agent: {}
}]


AWS.config.update({
  region: "us-east-2",
  // endpoint: "http://localhost:8000"
});

const docClient = new AWS.DynamoDB.DocumentClient();
const event_table = "event_t";
// middleware that is specific to this router
event.use(function timeLog (req, res, next) {
  console.log('Time: ', Date.now())
  next()
})

addEventSchema(){
  return joi.object().keys({
    action_creator: joi.string().optional(),
    receiver: joi.string().optional(),
    event_type: joi.string().optional(),
    time: joi.string().optional(),
    url_from: joi.string().optional(),
    agent: joi.string().optional(),
  })
}

// define the home page route
event.post('/addEvent', Validator(addEventSchema), function (req, res) {
  console.log(req.body);
  var params = {
		TableName: event_table,
		Item: {
      event_id: req.body.event_id,
      action_creator: req.body.action_creator,
      receiver: req.body.receiver,
      event_type: req.body.event_type,
      time: req.body.time,
      url_from: req.body.url_from,
      agent: req.body.agent
		}
	};
  console.log(params);

  console.log("Adding a new event...");
  client.get(data, async (err, redisres) => {
    if (redisres) {
      res.status(201).json(Object.assign(data,{"message": "data already stored"}))
    } else {
      docClient.put(params, function(err, data) {
          if (err) {
              console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
          } else {
              client.setex(data, 1440, JSON.stringify(data));
              console.log("Added item:", JSON.stringify(data, null, 2));
              res.status(201).json(data)
          }
      });
    }
  })
})

event.get('/listEvent/:action_creator?/:receiver?/:event_type?/:url_from?', function (req, res) {
  let filter =  {
    action_creator: req.params.action_creator,
    receiver: req.params.receiver,
    event_type: req.params.event_type,
    url_from: req.params.url_from
  }
  var params = {
		TableName: event_table,
    Key: filter
	};
  docClient.scan(params, onScan);

  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          // print all the Products
          console.log("Scan succeeded.");
          res.status(200).json(data)
      }
  }
})


event.post('/singleEvent/:eventId', function (req, res) {
  var params = {
    TableName: event_table,
    Key:{event_id: req.params.eventId}
  };
  docClient.scan(params, onScan);

  function onScan(err, data) {
      if (err) {
          console.error("Unable to scan the table. Error JSON:", JSON.stringify(err, null, 2));
      } else {
          // print all the Products
          console.log("Scan succeeded.");
          res.status(200).json(data)
      }
  }
})

module.exports = event
