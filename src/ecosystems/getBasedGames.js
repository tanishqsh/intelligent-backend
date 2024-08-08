const { fetchQuery } = require('@airstack/node');
const { getUserByAssociatedAddress } = require('../utils/airstack-query-constructors/getUserByAssociatedAddress');
const axios = require('axios');
const { createPublicClient, http } = require('viem');
const { mainnet } = require('viem/chains');

const baseUrl = 'https://highlight-creator-assets.highlight.xyz/main/base-dir/0add9348-d152-45c7-99b5-ec6fddcd093a/onChainDir/';
const contractAddress = '0x298DeFeCd684Eb48474363dA6777805D3B576431';

const client = createPublicClient({
	chain: mainnet,
	transport: http('https://mainnet.base.org'),
});

const abi = [
	{
		name: 'ownerOf',
		type: 'function',
		stateMutability: 'view',
		inputs: [{ name: 'tokenId', type: 'uint256' }],
		outputs: [{ name: '', type: 'address' }],
	},
];

const fetchData = async (i) => {
	const url = `${baseUrl}${i}`;
	try {
		const response = await axios.get(url);
		const { attributes } = response.data;
		const clanAttribute = attributes.find((attr) => attr.trait_type === 'Clan');
		const clanValue = clanAttribute ? clanAttribute.value : 'N/A';

		try {
			const owner = await client.readContract({
				address: contractAddress,
				abi,
				functionName: 'ownerOf',
				args: [BigInt(i)],
			});

			console.log(`Number: ${i}, Clan: ${clanValue}, Owner: ${owner}`);

			const airstackUser = await getDetailsFromAirstack(owner);

			const user = {
				nftId: i,
				clan: clanValue,
				owner: owner,
				...airstackUser.Socials.Social[0],
			};

			console.log('Combined user object:', user);
			return user;
		} catch (error) {
			console.error(`Error getting owner for NFT ${i}. Response code: ${error.response?.status || 'Unknown'}`);
		}
	} catch (error) {
		if (axios.isAxiosError(error) && error.response?.status === 403) {
			console.log(`Skipping ${i} due to 403 response`);
		} else {
			console.error(`Error fetching data for NFT ${i}. Response code: ${error.response?.status || 'Unknown'}`);
		}
	}
};

const fetchAllData = async () => {
	const users = [];
	for (let i = 1; i <= 200; i++) {
		const user = await fetchData(i);
		if (user) users.push(user);
	}
	return users;
};

const getDetailsFromAirstack = async (address) => {
	const user = await fetchQuery(getUserByAssociatedAddress(address));
	return user;
};

fetchAllData().then((users) => {
	console.log('All users:', users);
});
