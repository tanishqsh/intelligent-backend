function getRepliesByUrlQuery(url: string) {
	return `
    query MyQuery {
  FarcasterReplies(
    input: {filter: {parentUrl: {_eq: "${url}"}}, blockchain: ALL, limit: 100}
  ) {
    Reply {
      castedAtTimestamp
      fid
      url
      text
      numberOfLikes
      numberOfRecasts
      numberOfReplies
      castedBy {
        isFarcasterPowerUser
        connectedAddresses {
          address
          blockchain
        }
        profileDisplayName
        profileHandle
        profileImage
      }
    }
    pageInfo {
      hasPrevPage
      nextCursor
      prevCursor
      hasNextPage
    }
  }
}
  `;
}

export { getRepliesByUrlQuery };
