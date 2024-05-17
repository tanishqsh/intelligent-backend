function getRecastsByUrlQuery(url: string) {
	return `
    query MyQuery {
  FarcasterCasts(
    input: {filter: {url: {_eq: "${url}"}}, blockchain: ALL,  limit: 200}
  ) {
    Cast {
      castedAtTimestamp
      embeds
      text
      numberOfRecasts
      numberOfLikes
      numberOfReplies
      channel {
        channelId
      }
      mentions {
        fid
        position
      }
      socialCapitalValue {
        rawValue
        formattedValue
      }
    }
  }
  Recasts: FarcasterReactions(
    input: {filter: {castUrl: {_eq: "${url}"}, criteria: recasted}, blockchain: ALL, limit: 200}
  ) {
    Recasts: Reaction {
      reactedBy {
        isFarcasterPowerUser
        profileHandle
        profileImage
        profileDisplayName
         connectedAddresses{
            address
            blockchain
        }
      }
    }
  }
}
  `;
}

export { getRecastsByUrlQuery };
