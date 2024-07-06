function getTokenBalancesByAddress(addresses: string[]): string {
	return `
    query MyQuery {
  TokenBalances(
    input: {filter: {owner: {_in: ${JSON.stringify(addresses)}}, tokenType: {_eq: ERC20}}, blockchain: ethereum, limit: 100}
  ) {
    TokenBalance {
      owner {
        addresses
      }
      amount
      tokenAddress
      token {
        name
        symbol
        isSpam
        address
        id
        contractMetaData {
          image
        }
      }
      formattedAmount
    }
    pageInfo {
      nextCursor
      prevCursor
      hasNextPage
    }
  }
}
  `;
}

export { getTokenBalancesByAddress };
