import { init } from '@airstack/node';

const initializeAirstack = () => {
	init(process.env.AIRSTACK_API_KEY || '1e1d31463b5a24afd84b4e0f87ccbf369');
	console.log('Airstack is ready 🟡');
};

export { initializeAirstack };
