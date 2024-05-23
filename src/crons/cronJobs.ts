import cron from 'node-cron';
import fetchUsersFromDB from '../db/fetchUsersFromDB';
import syncAlfaFrensQueue from '../queues/syncAlfaFrensQueue';

// Log message indicating that the cron has been loaded
console.log('Cron jobs are ready 🟡');

// Schedule a task to run every 6 hours
cron.schedule('0 */6 * * *', async () => {
	console.log('Cron job executed every 6 hours');
	// Add your task logic here

	const users = await fetchUsersFromDB();
	console.log('Users:==', users);

	// add each user to the queue
	users.forEach((fid) => {
		addToQueue(fid);
	});
});

const addToQueue = async (fid: string) => {
	const job = await syncAlfaFrensQueue.add(`syncAlfaFrensQueue: ${fid}`, fid);
	console.log(`Alfa Fren Sync Job for ${fid} added to queue ✅ by cron`);
};
