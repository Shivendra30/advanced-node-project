jest.setTimeout(30000);

require('../models/User');
const keys = require('../config/keys');
const mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose
	.connect(keys.mongoURI, { useNewUrlParser: true })
	.then(() => console.log('Connected to MongoDB'))
	.catch(console.log);
