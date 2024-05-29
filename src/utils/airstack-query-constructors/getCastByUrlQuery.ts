function getCastByUrlQuery(url: string) {
	return `
    query MyQuery {
  FarcasterCasts(
    input: {blockchain: ALL, filter: {url: {_eq: "${url}"}}}
  ) {
    Cast {
      text
      castedAtTimestamp
      fid
      hash
      numberOfReplies
      numberOfRecasts
      numberOfLikes
      mentions {
        fid
        position
        profile {
          profileHandle
          profileDisplayName
          profileImage
          profileUrl
        }
      }
      socialCapitalValue {
        formattedValue
        hash
        rawValue
      }
      embeds
      castedBy {
        profileHandle
        profileImage
        profileDisplayName
        socialCapital {
          socialCapitalRank
          socialCapitalScore
        }
      }
      channel {
        channelId
        imageUrl
        name
        url
      }
      url
    }
  }
}
  `;
}

export { getCastByUrlQuery };
