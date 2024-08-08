function getUserByAssociatedAddress(address: string): string {
	return `
    query GetUserByAssociatedAddress {
  Socials(
    input: {blockchain: ethereum, filter: {userAssociatedAddresses: {_in: "${address}"}}}
  ) {
    Social {
      isFarcasterPowerUser
      profileName
      profileImage
      profileDisplayName
      farcasterScore {
        farRank
        farScore
      }
      profileHandle
      profileBio
      followerCount
      followingCount
      userId
    }
  }
}
  `;
}

export { getUserByAssociatedAddress };
