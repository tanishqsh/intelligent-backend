// get all followers of 'sonata' and their connected wallet addresses

import axios from 'axios';
import { getUserByFID } from '../airstack-query-constructors/getUserByFID';
import { fetchQuery } from '@airstack/node';
import fs from 'fs';

async function getAllChannelFollowers(): Promise<any[]> {
	let channelName = '0773h';
	let api_endpoint = 'https://api.warpcast.com/v1/channel-followers?channelId=' + channelName;

	let followers: any[] = [];
	let nextCursor: string | null = null;
	let cycle = 0;

	do {
		// The issue was that the api_endpoint was being redeclared inside the loop but not outside of it.
		// This means that the updated api_endpoint with the new cursor was not being used in the axios.get call.
		// To fix this, we remove the redeclaration of api_endpoint inside the loop and just update it directly.
		if (nextCursor) {
			api_endpoint = 'https://api.warpcast.com/v1/channel-followers?channelId=' + channelName;
			api_endpoint += '&cursor=' + nextCursor;
		}

		try {
			const response = await axios.get(api_endpoint);
			const users = response.data.result.users;
			followers = followers.concat(users.map((user: any) => user.fid));

			nextCursor = response.data.next ? response.data.next.cursor : null;
			console.log('nextCursor:', response.data.next, 'Cycle:', cycle);
		} catch (error) {
			console.error(error);
			nextCursor = null;
		}
		cycle++;
	} while (nextCursor);

	// now we have the followers, let's get their wallet addresses

	let followersWithWallets = [];

	// fetchQuery(getUserByFID(followers[0]));

	for (let i = 0; i < followers.length; i++) {
		let follower = followers[i];
		let query = getUserByFID(follower);
		let result = await fetchQuery(query);
		let connectedAddress = getConnectedAddressFromAirstack(result);
		console.log(`Processing ${i + 1}/${followers.length}: fid: ${follower}, connectedAddress: ${connectedAddress}`);
		followersWithWallets.push({
			follower,
			connectedAddress,
		});
	}

	// Save the current state of followersWithWallets to a file
	const json = JSON.stringify(followersWithWallets, null, 2);
	fs.writeFileSync(`${channelName}_followers_connected_addresses.json`, json);

	const csv = followersWithWallets.map((obj) => Object.values(obj).join(',')).join('\n');
	fs.writeFileSync(`${channelName}_followers_connected_addresses.csv`, csv);
	return followersWithWallets;
}

const getConnectedAddressFromAirstack = (object: any) => {
	// where the connectedAddresses is an array of object where each object has address and blockchain keys, so we need ot find the address where the blockchain is "ethereum" and just 1

	const connectedAddresses = object?.data?.Socials?.Social[0]?.connectedAddresses;
	let address = '';
	for (let i = 0; i < connectedAddresses.length; i++) {
		if (connectedAddresses[i].blockchain === 'ethereum') {
			address = connectedAddresses[i].address;
			break;
		}
	}

	return address;
};

export { getAllChannelFollowers };
