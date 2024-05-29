function getLikesByUrlQuery(url: string, cursor: string) {
	return `
    query MyQuery {
  FarcasterReactions(
    input: {filter: {criteria: liked, castUrl: {_eq: "${url}"}}, blockchain: ALL, cursor: "${cursor}", limit: 200}
  ) {
    Reaction {
      reactedBy {
        connectedAddresses {
          address
          blockchain
        }
        isFarcasterPowerUser
        profileDisplayName
        profileHandle
        profileImage
        updatedAt
        userId
        socialCapital {
          socialCapitalRank
        }
      }
      cast {
        url
        hash
      }
    }
    pageInfo {
      hasNextPage
      hasPrevPage
      nextCursor
      prevCursor
    }
    Criteria
  }
}
  `;
}

export { getLikesByUrlQuery };
