const TRANSACTION_ID_QUERIES: string[] = ['SearchTimeline'];

export function needsTransactionId(apiUrl: string): boolean {
  const url = new URL(apiUrl);

  if (apiUrl.includes('graphql')) {
    const query = url.pathname.split('/').pop();
    return TRANSACTION_ID_QUERIES.some(endpoint => endpoint === query);
  }

  return false;
}
