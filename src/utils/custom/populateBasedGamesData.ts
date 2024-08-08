import axios from 'axios';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { fetchQuery } from '@airstack/node';
import { getUserByAssociatedAddress } from '../airstack-query-constructors/getUserByAssociatedAddress';
import { firebase } from '../../firebase/firebase';

const BASE_URL = 'https://highlight-creator-assets.highlight.xyz/main/base-dir/0add9348-d152-45c7-99b5-ec6fddcd093a/onChainDir/';
const CONTRACT_ADDRESS = '0x298DeFeCd684Eb48474363dA6777805D3B576431';

const client = createPublicClient({
	chain: mainnet,
	transport: http('https://mainnet.base.org'),
});

const ABI = [
	{
		name: 'ownerOf',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ name: 'tokenId', type: 'uint256' }],
		outputs: [{ name: '', type: 'address' }],
	},
];

async function fetchData(tokenId: number): Promise<any> {
	console.log(`Fetching data for NFT ${tokenId}`);
	const url = `${BASE_URL}${tokenId}`;
	try {
		const { data } = await axios.get(url);
		const { attributes, name, description, image, animation_url } = data;
		const clanAttribute = attributes.find((attr: any) => attr.trait_type === 'Clan');
		console.log(`Number: ${tokenId}, Clan: ${clanAttribute ? clanAttribute.value : 'N/A'}`);

		const owner = (await client.readContract({
			address: CONTRACT_ADDRESS,
			abi: ABI,
			functionName: 'ownerOf',
			args: [BigInt(tokenId)],
		})) as string;
		console.log(`Owner of NFT ${tokenId}:`, owner);

		const airstackUser = await getDetailsFromAirstack(owner);
		const userDetailObject = airstackUser?.data?.Socials?.Social?.[0] || {};
		if (!userDetailObject) console.log(`No social details found for owner ${owner}`);

		return { tokenId, attributes, name, description, image, animation_url, ownerAddress: owner, user: userDetailObject };
	} catch (error: any) {
		if (axios.isAxiosError(error) && error.response?.status === 403) {
			console.log(`Skipping ${tokenId} due to 403 response`);
		} else {
			console.error(`Error fetching data for NFT ${tokenId}. Response code: ${error.response?.status || 'Unknown'}`);
		}
	}
}

async function getDetailsFromAirstack(address: string): Promise<any> {
	try {
		const user = await fetchQuery(getUserByAssociatedAddress(address));
		console.log(`Fetched details from Airstack for address ${address}:`, user);
		return user;
	} catch (error) {
		console.error(`Error fetching details from Airstack for address ${address}`, error);
		return null;
	}
}

async function populateBasedGamesData(): Promise<any[]> {
	const allPlayers: any[] = [];
	const promises = Array.from({ length: 200 }, (_, i) => fetchData(i + 1));

	const users = await Promise.all(promises);
	users.forEach((user, i) => {
		if (user) {
			console.log(user);
			firebase.db
				.collection('based_games')
				.doc(`${i + 1}`)
				.set(user);
		}
	});

	return allPlayers;
}

export { populateBasedGamesData };
