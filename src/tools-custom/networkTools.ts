import { Tool } from '@aispec/lib/types/tool';
import axios, { AxiosRequestConfig } from 'axios';
import * as cheerio from 'cheerio';

interface ApiResponse {
  status: number;
  data: any;
  headers: Record<string, string>;
}

interface ScrapingResult {
  title: string;
  content: string;
  links: string[];
  metadata: Record<string, string>;
}

/**
 * Validates URL for security
 */
function validateUrl(url: string, allowedDomains: string[] = []): boolean {
  try {
    const parsedUrl = new URL(url);
    if (allowedDomains.length === 0) return true;
    return allowedDomains.some(domain => parsedUrl.hostname.endsWith(domain));
  } catch {
    return false;
  }
}

export const apiRequestTool: Tool = {
  id: 'api_request',
  name: 'API Request',
  description: 'Makes HTTP requests to APIs',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to send the request to',
      required: true,
    },
    {
      name: 'method',
      type: 'string',
      description: 'HTTP method (GET, POST, PUT, DELETE)',
      required: false,
    },
    {
      name: 'headers',
      type: 'object',
      description: 'Request headers',
      required: false,
    },
    {
      name: 'data',
      type: 'object',
      description: 'Request body data',
      required: false,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Request timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: Record<string, any>): Promise<ApiResponse> => {
    try {
      const {
        url,
        method = 'GET',
        headers = {},
        data = null,
        timeout = 30000
      } = params;
      
      // Validate URL
      if (!validateUrl(url)) {
        throw new Error(`Invalid URL: ${url}`);
      }
      
      const config: AxiosRequestConfig = {
        method,
        url,
        headers,
        data,
        timeout,
        validateStatus: () => true, // Don't throw on any status
      };
      
      const response = await axios(config);
      
      return {
        status: response.status,
        data: response.data,
        headers: response.headers as Record<string, string>
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`API request failed: ${error.message}`);
      }
      throw new Error('API request failed: Unknown error');
    }
  },
};

export const webScraperTool: Tool = {
  id: 'web_scraper',
  name: 'Web Scraper',
  description: 'Scrapes content from web pages',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to scrape',
      required: true,
    },
    {
      name: 'selectors',
      type: 'object',
      description: 'CSS selectors to extract specific content',
      required: false,
    },
    {
      name: 'timeout',
      type: 'number',
      description: 'Request timeout in milliseconds',
      required: false,
    }
  ],
  returnType: 'object',
  handler: async (params: Record<string, any>): Promise<ScrapingResult> => {
    try {
      const {
        url,
        selectors = {},
        timeout = 30000
      } = params;
      
      // Validate URL
      if (!validateUrl(url)) {
        throw new Error(`Invalid URL: ${url}`);
      }
      
      // Fetch page content
      const response = await axios.get(url, {
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AssistantBot/1.0)',
        },
      });
      
      const $ = cheerio.load(response.data);
      
      // Extract content based on selectors or defaults
      const result: ScrapingResult = {
        title: $('title').text().trim(),
        content: $('body').text().trim(),
        links: [],
        metadata: {},
      };
      
      // Extract links
      $('a').each((_, element) => {
        const href = $(element).attr('href');
        if (href) {
          try {
            const absoluteUrl = new URL(href, url).toString();
            result.links.push(absoluteUrl);
          } catch {
            // Skip invalid URLs
          }
        }
      });
      
      // Extract metadata
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property');
        const content = $(element).attr('content');
        if (name && content) {
          result.metadata[name] = content;
        }
      });
      
      // Extract custom selectors if provided
      if (Object.keys(selectors).length > 0) {
        for (const [key, selector] of Object.entries(selectors)) {
          result.metadata[key] = $(selector).text().trim();
        }
      }
      
      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Web scraping failed: ${error.message}`);
      }
      throw new Error('Web scraping failed: Unknown error');
    }
  },
};
