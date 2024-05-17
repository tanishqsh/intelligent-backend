import { Request, Response, NextFunction } from 'express';
import getWhitelist from '../utils/getWhitelist';

const checkIfWhitelisted = async (req: Request, res: Response, next: NextFunction) => {
	let whitelist = await getWhitelist();
	console.log('Checking Whitelist: ', whitelist);

	// at this point we will check with privy if the user is whitelisted, TODO:

	next();
};

export default checkIfWhitelisted;
