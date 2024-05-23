import { Request, Response, NextFunction } from 'express';
import privyClient from '../utils/privyClient';

const checkPrivyToken = async (req: Request, res: Response, next: NextFunction) => {
	const accessToken = req?.headers?.authorization?.replace('Bearer ', '');

	if (!accessToken) {
		return res.status(401).json({
			message: 'Unauthorized: No access token provided',
		});
	}

	try {
		const verifiedClaims = await privyClient.verifyAuthToken(accessToken);
		if (verifiedClaims) {
			console.log(`Login verified:`, verifiedClaims.userId);
		}
	} catch (error) {
		console.log(`Token verification failed with error ${error}.`);
	}

	next();
};

export default checkPrivyToken;
