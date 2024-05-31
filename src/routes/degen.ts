import axios from 'axios';
import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
	const fid = req.query.fid;

	if (!fid) {
		return res.status(400).json({
			message: 'Invalid request, fid is required',
			success: false,
		});
	}

	const url = await createURL(fid as string);

	try {
		const response = await axios.get(url);

		if (response.data?.allowance) {
			return res.json({
				...response.data?.allowance,
				message: 'Allowance fetched successfully',
				success: true,
			});
		} else {
			return res.status(404).json({
				message: 'No allowance found for the given fid',
				success: false,
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: 'An error occured while fetching allowance',
		});
	}

	return res.json({
		message: '🟡',
	});
});

async function createURL(fid: string) {
	const url = 'https://degentipme-3f9959094869.herokuapp.com/api/get_allowance?fid=' + fid;
	return url;
}

export default router;
