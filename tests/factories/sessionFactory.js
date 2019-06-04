const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');
const keys = require('../../config/keys');
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = user => {
	//Generate a fake session object
	const sessionObject = { passport: { user: user._id.toString() } };
	const session = Buffer.from(JSON.stringify(sessionObject)).toString(
		'base64'
	);

	//Generate session signature
	const sig = keygrip.sign(`session=${session}`);
	return { session, sig };
};
