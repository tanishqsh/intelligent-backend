function getReplyCastMetaByHashQuery(hash: string) {
	return `
    query getReplyCastMetaByHashQuery {
  FarcasterReplies(
    input: {blockchain: ALL, filter: {hash: {_eq: "${hash}"}}}
  ) {
    Reply {
      castedAtTimestamp
      numberOfReplies
      url
      channel {
        channelId
        name
        imageUrl
      }
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

export { getReplyCastMetaByHashQuery };
