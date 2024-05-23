import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		message: 'Users 🟡',
	});
});

router.post('/log-user', async (req, res) => {
	const accessToken = req?.headers?.authorization?.replace('Bearer ', '');

	if (!accessToken) {
		return res.status(401).json({
			message: 'Unauthorized',
		});
	}

	return res.json({
		message: 'User logged',
		accessToken,
	});

	// best way to check for the whitelist, and then send back authentication cookie, lets setup privy on the backend here
	// check if the user is whitelisted
	// if whitelisted, send back the authentication cookie
	// if not whitelisted, return a 401
});

export default router;
