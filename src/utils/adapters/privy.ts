function privyUserObjectAdapter(user: any) {
	const privyId = user.id ?? ''; // returns privyId
	const privyUserCreatedAt = user.createdAt ?? ''; // returns privyUserCreatedAt
	const privyLinkedAccounts = user.linkedAccounts ?? ''; // returns privyLinkedAccounts
	const privyEmail = user.email ?? ''; // returns privyEmail
	const privyPhone = user.phone ?? ''; // returns privyPhone
	const privyWallets = user.wallet ?? ''; // returns privyWallets
	const privyFarcaster = user.farcaster ?? {}; // returns privyFarcaster
	const fid = user.farcaster?.fid ?? ''; // returns fid
	const displayName = user.farcaster?.displayName ?? ''; // returns displayName
	const username = user.farcaster?.username ?? ''; // returns username
	const bio = user.farcaster?.bio ?? ''; // returns bio
	const pfp = user.farcaster?.pfp ?? ''; // returns profilePicture

	return {
		privyId,
		privyUserCreatedAt,
		privyLinkedAccounts,
		privyEmail,
		privyPhone,
		privyWallets,
		privyFarcaster,
		fid,
		displayName,
		username,
		bio,
		pfp,
	};
}

export { privyUserObjectAdapter };
