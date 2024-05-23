import express from 'express';
import privyClient from '../utils/privyClient';
import checkPrivyToken from '../middleware/checkPrivyToken';

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		message: 'Users 🟡',
	});
});

router.post('/log-user', checkPrivyToken, async (req, res) => {
	const user = req.body.user;

	return res.json({
		message: 'User logged',
		fetchedUser: user,
	});
});

export default router;
