import express from 'express';
import checkPrivyToken from '../middleware/checkPrivyToken';

const router = express.Router();

router.get('/', (req, res) => {
	res.json({
		message: 'Users 🟡',
	});
});

router.post('/log-user', checkPrivyToken, async (req, res) => {
	return res.json({
		message: 'User logged',
		success: true,
	});
});

export default router;
