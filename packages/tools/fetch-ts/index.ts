import { Tool } from '@aispec/tool-types';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import fetch from 'node-fetch';
import TurndownService from 'turndown';
import { URL } from 'url';

const DEFAULT_USER_AGENT
  = 'ModelContextProtocol/1.0 (+https://github.com/modelcontextprotocol/servers)';

/**
 *
 * @param url
 * @param userAgent
 */
async function canFetchUrl(url: string, userAgent: string): Promise<boolean> {
  const robotsTxt = await getRobotsTxt(url, userAgent);
  if (!robotsTxt) return true;

  // Simple robots.txt parsing
  const lines = robotsTxt
    .split('\n')
    .map(line => line.trim())
    .filter(line => !line.startsWith('#') && line.length > 0);

  let currentUserAgent = '*';
  let disallowedPaths: string[] = [];

  for (const line of lines) {
    const [directive, value] = line.split(':').map(s => s.trim());

    if (directive.toLowerCase() === 'user-agent') {
      currentUserAgent = value;
      if (currentUserAgent === '*' || userAgent.includes(currentUserAgent)) {
        disallowedPaths = [];
      }
    }
    else if (
      directive.toLowerCase() === 'disallow'
      && (currentUserAgent === '*' || userAgent.includes(currentUserAgent))
    ) {
      disallowedPaths.push(value);
    }
  }

  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname + parsedUrl.search;

  return !disallowedPaths.some(disallowedPath =>
    path.startsWith(disallowedPath.replace('*', '')),
  );
}

/**
 *
 * @param url
 * @param userAgent
 */
async function fetchAndExtractContent(
  url: string,
  userAgent: string,
): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (status ${response.status})`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error('Failed to parse article content');
    }

    const turndownService = new TurndownService({
      codeBlockStyle: 'fenced',
      headingStyle: 'atx',
    });

    return turndownService.turndown(article.content);
  }
  catch (error) {
    throw new Error(`Error processing URL: ${error.message}`);
  }
}

// Helper functions
/**
 *
 * @param url
 * @param userAgent
 */
async function getRobotsTxt(
  url: string,
  userAgent: string,
): Promise<null | string> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': userAgent },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        `Robots.txt access forbidden (status ${response.status})`,
      );
    }

    if (response.status >= 400 && response.status < 500) {
      return null;
    }

    return await response.text();
  }
  catch (error) {
    console.error(`Error fetching robots.txt: ${error.message}`);
    return null;
  }
}

// Tool definition
const fetchUrlTool: Tool = {
  description:
    'Fetches a URL from the internet and extracts its contents as markdown. Respects robots.txt and includes proper user agent identification.',
  handler: async (params: any) => {
    const { ignoreRobotsTxt = false, url } = params;

    try {
      if (!ignoreRobotsTxt) {
        const canFetch = await canFetchUrl(url, DEFAULT_USER_AGENT);
        if (!canFetch) {
          throw new Error('URL access restricted by robots.txt');
        }
      }

      const content = await fetchAndExtractContent(url, DEFAULT_USER_AGENT);
      return `Contents of ${url}:\n\n${content}`;
    }
    catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  },
  id: 'fetch_url',
  name: 'Fetch URL',
  parameters: [
    {
      description: 'URL to fetch',
      name: 'url',
      required: true,
      type: 'string',
    },
    {
      defaultValue: false,
      description: 'Whether to ignore robots.txt restrictions',
      name: 'ignoreRobotsTxt',
      required: false,
      type: 'boolean',
    },
  ],
  returnType: 'string',
};

const tools = [fetchUrlTool];

export { tools };
