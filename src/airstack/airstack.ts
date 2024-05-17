import { init } from '@airstack/node';

const initializeAirstack = () => {
	init(process.env.AIRSTACK_API_KEY || '18b1b82d545324ad1ae0da2a62ccdd726');
	console.log('Airstack is ready 🟡');
};

export { initializeAirstack };
