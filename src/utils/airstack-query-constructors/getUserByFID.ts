function getUserByFID(fid: string): string {
	return `
    query FarcasterUserData {
  Socials(input: {filter: {userId: {_eq: "${fid}"}}, blockchain: ethereum}) {
    Social {
      isFarcasterPowerUser
      followerCount
      connectedAddresses {
        address
        blockchain
      }
      profileBio
      profileHandle
      profileDisplayName
      profileImage
      socialCapital {
        socialCapitalScore
        socialCapitalRank
      }
      followingCount
      fnames
    }
  }
}
  `;
}

export { getUserByFID };
