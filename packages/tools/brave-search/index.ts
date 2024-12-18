import { Tool } from '@aispec/tool-types';
import fetch from 'node-fetch';

const BRAVE_API_KEY = process.env.BRAVE_API_KEY;
if (!BRAVE_API_KEY) {
  throw new Error('BRAVE_API_KEY environment variable is not set');
}

// Rate limiting
const RATE_LIMIT = {
  perMonth: 15000,
  perSecond: 1,
};

const requestCount = {
  lastReset: Date.now(),
  month: 0,
  second: 0,
};

interface BraveDescription {
  descriptions: Record<string, string>;
}

interface BraveLocation {
  address: {
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    streetAddress?: string;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  id: string;
  name: string;
  openingHours?: string[];
  phone?: string;
  priceRange?: string;
  rating?: {
    ratingCount?: number;
    ratingValue?: number;
  };
}

interface BravePoiResponse {
  results: BraveLocation[];
}

// Type definitions
interface BraveWeb {
  locations?: {
    results?: {
      id: string;
      title?: string;
    }[];
  };
  web?: {
    results?: {
      description: string;
      language?: string;
      published?: string;
      rank?: number;
      title: string;
      url: string;
    }[];
  };
}

/**
 *
 */
function checkRateLimit() {
  const now = Date.now();
  if (now - requestCount.lastReset > 1000) {
    requestCount.second = 0;
    requestCount.lastReset = now;
  }
  if (
    requestCount.second >= RATE_LIMIT.perSecond
    || requestCount.month >= RATE_LIMIT.perMonth
  ) {
    throw new Error('Rate limit exceeded');
  }
  requestCount.second++;
  requestCount.month++;
}

/**
 *
 * @param poisData
 * @param descData
 */
function formatLocalResults(
  poisData: BravePoiResponse,
  descData: BraveDescription,
): string {
  return (
    (poisData.results || [])
      .map((poi) => {
        const address
          = [
            poi.address?.streetAddress ?? '',
            poi.address?.addressLocality ?? '',
            poi.address?.addressRegion ?? '',
            poi.address?.postalCode ?? '',
          ]
            .filter(part => part !== '')
            .join(', ') || 'N/A';

        return `Name: ${poi.name}
Address: ${address}
Phone: ${poi.phone || 'N/A'}
Rating: ${poi.rating?.ratingValue ?? 'N/A'} (${poi.rating?.ratingCount ?? 0} reviews)
Price Range: ${poi.priceRange || 'N/A'}
Hours: ${(poi.openingHours || []).join(', ') || 'N/A'}
Description: ${descData.descriptions[poi.id] || 'No description available'}`;
      })
      .join('\n---\n') || 'No local results found'
  );
}

/**
 *
 * @param ids
 */
async function getDescriptionsData(ids: string[]): Promise<BraveDescription> {
  checkRateLimit();
  const url = new URL('https://api.search.brave.com/res/v1/local/descriptions');
  ids.filter(Boolean).forEach(id => url.searchParams.append('ids', id));

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as BraveDescription;
}

/**
 *
 * @param ids
 */
async function getPoisData(ids: string[]): Promise<BravePoiResponse> {
  checkRateLimit();
  const url = new URL('https://api.search.brave.com/res/v1/local/pois');
  ids.filter(Boolean).forEach(id => url.searchParams.append('ids', id));

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave API error: ${response.status} ${response.statusText}`,
    );
  }

  return (await response.json()) as BravePoiResponse;
}

/**
 *
 * @param query
 * @param count
 */
async function performLocalSearch(
  query: string,
  count = 5,
): Promise<string> {
  checkRateLimit();
  const webUrl = new URL('https://api.search.brave.com/res/v1/web/search');
  webUrl.searchParams.set('q', query);
  webUrl.searchParams.set('search_lang', 'en');
  webUrl.searchParams.set('result_filter', 'locations');
  webUrl.searchParams.set('count', Math.min(count, 20).toString());

  const webResponse = await fetch(webUrl, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  });

  if (!webResponse.ok) {
    throw new Error(
      `Brave API error: ${webResponse.status} ${webResponse.statusText}`,
    );
  }

  const webData = (await webResponse.json()) as BraveWeb;
  const locationIds
    = webData.locations?.results
      ?.filter((r): r is { id: string; title?: string } => r.id != null)
      .map(r => r.id) || [];

  if (locationIds.length === 0) {
    return performWebSearch(query, count);
  }

  const [poisData, descriptionsData] = await Promise.all([
    getPoisData(locationIds),
    getDescriptionsData(locationIds),
  ]);

  return formatLocalResults(poisData, descriptionsData);
}

// Helper functions
/**
 *
 * @param query
 * @param count
 * @param offset
 */
async function performWebSearch(
  query: string,
  count = 10,
  offset = 0,
): Promise<string> {
  checkRateLimit();
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', Math.min(count, 20).toString());
  url.searchParams.set('offset', offset.toString());

  const response = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Brave API error: ${response.status} ${response.statusText}`,
    );
  }

  const data = (await response.json()) as BraveWeb;
  const results = (data.web?.results || []).map(result => ({
    description: result.description || '',
    title: result.title || '',
    url: result.url || '',
  }));

  return results
    .map(
      r => `Title: ${r.title}\nDescription: ${r.description}\nURL: ${r.url}`,
    )
    .join('\n\n');
}

// Tool definitions
const webSearchTool: Tool = {
  description:
    'Performs a web search using the Brave Search API. Best for general queries, news, articles, and online content.',
  handler: async (params: any) => {
    return await performWebSearch(params.query, params.count, params.offset);
  },
  id: 'brave_web_search',
  name: 'Brave Web Search',
  parameters: [
    {
      description: 'Search query (max 400 chars, 50 words)',
      name: 'query',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 10,
      description: 'Number of results (1-20)',
      name: 'count',
      required: false,
      type: 'number',
    },
    {
      defaultValue: 0,
      description: 'Pagination offset (max 9)',
      name: 'offset',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const localSearchTool: Tool = {
  description:
    'Searches for local businesses and places. Best for location-based queries like restaurants, services, etc.',
  handler: async (params: any) => {
    return await performLocalSearch(params.query, params.count);
  },
  id: 'brave_local_search',
  name: 'Brave Local Search',
  parameters: [
    {
      description: 'Local search query (e.g. "pizza near Central Park")',
      name: 'query',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 5,
      description: 'Number of results (1-20)',
      name: 'count',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const tools = [webSearchTool, localSearchTool];

export { tools };
