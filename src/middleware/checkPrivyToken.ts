import { Request, Response, NextFunction } from 'express';
import privyClient from '../utils/privyClient';
import getWhitelist from '../utils/getWhitelist';
import { addUserToDB } from '../db/addUserToDB';
import { privyUserObjectAdapter } from '../utils/adapters/privy';

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
			const whitelist = await getWhitelist();
			const user = await privyClient.getUser(verifiedClaims.userId);

			const privyUser = privyUserObjectAdapter(user);

			console.log(`User obtained from privy:`, privyUser.fid);

			// @ts-ignore
			const { fid } = user.linkedAccounts.find((account) => account.type === 'farcaster');

			if (!whitelist.includes(fid)) {
				console.log(`${fid} is not in the whitelist`);
				return res.status(403).json({
					message: 'Unauthorized: User is not in the whitelist',
				});
			} else {
				await addUserToDB(privyUser);
				console.log(`${fid} is in the whitelist`);
			}
		}
	} catch (error) {
		console.log(`Token verification failed with error ${error}.`);
	}

	next();
};

export default checkPrivyToken;
