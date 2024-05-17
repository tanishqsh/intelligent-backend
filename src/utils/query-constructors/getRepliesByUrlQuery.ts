function getRepliesByUrlQuery(url: string, cursor: string = '') {
	return `
    query MyQuery {
  FarcasterReplies(
    input: {filter: {parentUrl: {_eq: "${url}"}}, blockchain: ALL, limit: 100, cursor: "${cursor}"}
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
      hash
      parentHash
      parentFid
      parentCast {
        url
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
