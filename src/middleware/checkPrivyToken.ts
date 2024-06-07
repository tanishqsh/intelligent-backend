import { Request, Response, NextFunction } from 'express';
import privyClient from '../utils/privyClient';
import getWhitelist from '../utils/getWhitelist';
import { addUserToDB } from '../db/addUserToDB';
import { privyUserObjectAdapter } from '../utils/adapters/privy';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';
import { globalUserUpdateQueue } from '../crons/cronJobs';

const checkPrivyToken = async (req: Request, res: Response, next: NextFunction) => {
	const accessToken = req?.headers?.authorization?.replace('Bearer ', '');

	if (!accessToken) {
		return res.status(401).json({
			message: 'Unauthorized: No access token provided',
		});
	}

	try {
		// verify the token with the privyClient
		const verifiedClaims = await privyClient.verifyAuthToken(accessToken);

		// if the claims exist, log the user in
		if (verifiedClaims) {
			console.log(`Login verified:`, verifiedClaims.userId);

			// get the array of users in the whitelist from the database
			const whitelist = await getWhitelist();

			// get the user from privy
			const user = await privyClient.getUser(verifiedClaims.userId);

			// use our custom adapter to convert the user object to the format we need
			const privyUser = privyUserObjectAdapter(user);

			const { fid } = privyUser;

			// if there is no fid in the user object, return an error
			if (!fid) {
				return res.status(403).json({
					message: 'Unauthorized: No FID found in the user object',
				});
			}

			// log the user obtained from privy
			console.log(`User obtained from privy:`, privyUser.fid);

			if (!whitelist.includes(fid)) {
				console.log(`${fid} is not in the whitelist`);
				return res.status(403).json({
					message: 'Unauthorized: User is not in the whitelist',
				});
			} else {
				await addUserToDB(privyUser);
				await globalUserUpdateQueue(fid, true);
				console.log(`${fid} is in the whitelist`);
			}
		}
	} catch (error) {
		console.log(`Token verification failed with error ${error}.`);
	}
	next();
};

export default checkPrivyToken;
