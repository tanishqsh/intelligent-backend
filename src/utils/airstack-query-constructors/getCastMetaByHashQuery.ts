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
        imageUrl
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
        quotedCast {
          url
        }
      }
      frame {
        frameUrl
        imageUrl
      }
      mentions {
        profile {
          profileImage
          profileHandle
          profileDisplayName
          isFarcasterPowerUser
        }
        position
      }
      embeds
    }
  }
}
  `;
}

export { getCastMetaByHashQuery };
