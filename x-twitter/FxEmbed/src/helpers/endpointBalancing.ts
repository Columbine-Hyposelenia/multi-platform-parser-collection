export interface BalancedEndpoint<TResponse> {
  name: string;
  weight: number;
  handler: () => Promise<TResponse>;
  resultCheck: (response: TResponse) => boolean;
}

/**
 * Try a set of endpoints in weighted-random order, falling back to the rest if the first fails.
 * Endpoints with weight <= 0 are ignored.
 */
export const tryBalancedEndpoints = async <TResponse>(
  endpoints: BalancedEndpoint<TResponse>[]
): Promise<TResponse | null> => {
  const usableEndpoints = endpoints.filter(endpoint => endpoint.weight > 0);
  if (usableEndpoints.length === 0) {
    return null;
  }

  const totalWeight = usableEndpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
  const random = Math.random() * totalWeight;
  let cumulativeWeight = 0;
  let selectedEndpoint = usableEndpoints[0];
  for (const endpoint of usableEndpoints) {
    cumulativeWeight += endpoint.weight;
    if (random <= cumulativeWeight) {
      selectedEndpoint = endpoint;
      break;
    }
  }

  try {
    const response = await selectedEndpoint.handler();
    if (selectedEndpoint.resultCheck(response)) {
      return response;
    }
  } catch (_e) {
    // Ignored; we'll try fallbacks below
  }

  for (const endpoint of usableEndpoints) {
    if (endpoint.name === selectedEndpoint.name) continue;
    try {
      const response = await endpoint.handler();
      if (endpoint.resultCheck(response)) {
        return response;
      }
    } catch (_e) {
      // Ignore and continue to next fallback
    }
  }

  return null;
};
