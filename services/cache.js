const mongoose = require('mongoose');
//Setup redis
const redis = require('redis');
const client = redis.createClient('redis://127.0.0.1:6379');
const util = require('util');
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
	//If this function is called, the exec function should cache the query

	this.useCache = true; //'this' here is the query instance
	this.hashKey = JSON.stringify(options.key || '');
	return this; //ensure that the function is chainable
};

mongoose.Query.prototype.exec = async function() {
	if (!this.useCache) return exec.apply(this, arguments);
	const key = JSON.stringify({
		...this.getQuery(),
		collection: this.mongooseCollection.name
	});

	//See if we have a value for the key in redis
	const cachedValue = await client.hget(this.hashKey, key);

	//If we do, return the value
	if (cachedValue) {
		const doc = JSON.parse(cachedValue);

		return Array.isArray(doc)
			? doc.map(d => this.model(d))
			: new this.model(doc);
	}

	//If not, execute the query and store the result in redis
	const result = await exec.apply(this, arguments); //this result is a mongo document
	console.log('From Mongo', result);
	console.log('hashKey', this.hashKey);
	client.hmset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
	return result;
};

module.exports = {
	clearHash(hashKey) {
		client.del(JSON.stringify(hashKey));
	}
};
