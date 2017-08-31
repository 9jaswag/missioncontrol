const { getVehiclesInRange } = require('./store/vehicles');
const { getBidsForRequest } = require('./store/bids');
const { createRequest } = require('./store/requests');
const { hasStore } = require('./lib/environment');

// Create thrift connection to Captain
require('./client-thrift').start({port: process.env.CAPTAIN_PORT, host: process.env.CAPTAIN_HOST});

const express = require('express');
const app = express();
const port = process.env.WEB_SERVER_PORT || 8888;

// Allow CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Define routes
app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/status', async (req, res) => {
  const vehicles =
    (!hasStore) ? [] : await getVehiclesInRange(
      { lat: parseFloat(req.query.lat), long: parseFloat(req.query.long) },
      7000
    );

  const { requestId } = req.query;
  const bids = (!hasStore || !requestId) ? [] : await getBidsForRequest(requestId);

  res.json({ vehicles, bids });
});

app.get('/request/new', async (req, res) => {
  const { user_id, pickup, dropoff, requested_pickup_time, size, weight } = req.query;
  const requestId = await createRequest({
    user_id, pickup, dropoff, requested_pickup_time, size, weight
  });
  if (requestId) {
    res.json({ requestId });
  } else {
    res.status(500).send('Something broke!');
  }
});

module.exports = {
  start: () => {
    // Start the server
    app.listen(port, () => {
      console.log(`Web server started. Listening on port ${port}`);
    });
  }
};
