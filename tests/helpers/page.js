const puppeteer = require('puppeteer');

const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class CustomPage {
	static async build() {
		const browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox'] //decrease the amount of time to run tests
		});
		const page = await browser.newPage();

		const customPage = new CustomPage(page);
		//Create a JS proxy to use both the page (from puppeteer), our custom page as well as the browser
		return new Proxy(customPage, {
			get: function(target, property) {
				return (
					customPage[property] || browser[property] || page[property]
				);
			}
		});
	}

	constructor(page) {
		this.page = page;
	}

	async login() {
		//Get the user from the user factory
		const user = await userFactory();

		//Get the session ang signature from the session factory
		const { session, sig } = sessionFactory(user);

		//Set the session and sig to the page instance
		await this.page.setCookie({ name: 'session', value: session });
		await this.page.setCookie({ name: 'session.sig', value: sig });

		//refresh the page and go to blogs
		await this.page.goto('http://localhost:3000/blogs');

		//Wait for the element to be visible
		await this.page.waitFor('a[href="/auth/logout"]');
	}

	async getContentsOf(selector) {
		return await this.page.$eval(selector, el => el.innerHTML);
	}

	async makeRequest(path, type, data = {}) {
		return await this.page.evaluate(
			(_path, _data, _type) => {
				//If the request is not GET, attach a body
				_data =
					_type !== 'GET'
						? { ..._data, body: JSON.stringify(_data) }
						: _data;
				return fetch(_path, {
					method: _type,
					credentials: 'same-origin',
					headers: {
						'Content-Type': 'application/json'
					}
				}).then(res => res.json());
			},
			path,
			data,
			type
		);
	}

	async execRequests(actions) {
		return Promise.all(
			actions.map(({ type, path, data }) => {
				data = data ? data : {};
				return this.makeRequest(path, type, data);
			})
		);
	}
}

module.exports = CustomPage;
