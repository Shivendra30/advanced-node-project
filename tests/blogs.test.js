const Page = require('./helpers/page'); //Custom page that we created

let page;

//Execute before each test
beforeEach(async () => {
	page = await Page.build();
	await page.goto('http://localhost:3000');
});

afterEach(async () => {
	await page.close();
});

describe('When logged in ', async () => {
	beforeEach(async () => {
		await page.login();
		await page.click('a.btn-floating');
	});

	//When we are logged in, we can see the blog creation form
	test('can see blog create form', async () => {
		//Check if the blog create form appeared
		const formLabel = await page.getContentsOf('form label');
		expect(formLabel).toEqual('Blog Title');
	});

	describe('and using valid inputs', async () => {
		beforeEach(async () => {
			await page.type('.title input', 'My Title');
			await page.type('.content input', 'My Content');
			await page.click('form button');
		});

		test('submitting takes user to review screen', async () => {
			const text = await page.getContentsOf('form h5');
			expect(text).toEqual('Please confirm your entries');
		});

		test('submitting and saving, then adds blog to the index page', async () => {
			await page.click('button.green');
			await page.waitFor('.card');
			const cardTitle = await page.getContentsOf('.card-title');
			const cardContent = await page.getContentsOf('.card-content p');

			expect(cardTitle).toEqual('My Title');
			expect(cardContent).toEqual('My Content');
		});
	});

	//When logged in and using invalid inputs, the form shows an error message
	describe('and using invalid inputs', async () => {
		beforeEach(async () => {
			await page.click('form button');
		});

		test('the form shows an error message', async () => {
			const titleError = await page.getContentsOf('.title .red-text');
			const contentError = await page.getContentsOf('.content .red-text');
			expect(titleError).toEqual('You must provide a value');
			expect(contentError).toEqual('You must provide a value');
		});
	});
});

describe('When not logged in ', async () => {
	const actions = [
		{
			type: 'POST',
			path: '/api/blogs',
			data: {
				title: 'My Title',
				content: 'My Content'
			}
		},
		{
			type: 'GET',
			path: '/api/blogs'
		}
	];
	test('blog related actions are prohibited', async () => {
		const results = await page.execRequests(actions);
		results.forEach(result => {
			expect(result).toEqual({ error: 'You must log in!' });
		});
	});
});
