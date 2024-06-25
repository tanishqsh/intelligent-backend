function getCastMetaByHashQuery(hash: string) {
	return `
    query getCastMetaByHashQuery {
  FarcasterCasts(
    input: {blockchain: ALL, filter: {hash: {_eq: "${hash}"}}}
  ) {
    Cast {
      channel {
        channelId
        name
      }
      numberOfReplies
      url
      quotedCast {
        castedAtTimestamp
        castedBy {
          id
          isFarcasterPowerUser
          profileDisplayName
          profileHandle
          profileImage
        }
        text
        url
      }
      parentCast {
        castedAtTimestamp
        castedBy {
          id
          isFarcasterPowerUser
          profileDisplayName
          profileHandle
          profileImage
        }
        text
        url
      }
    }
  }
}
  `;
}

export { getCastMetaByHashQuery };
