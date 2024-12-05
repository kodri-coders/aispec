import { Tool } from "@aispec/tool-types";
import fetch from "node-fetch";
import { URL } from "url";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

const DEFAULT_USER_AGENT =
  "ModelContextProtocol/1.0 (+https://github.com/modelcontextprotocol/servers)";

// Helper functions
async function getRobotsTxt(
  url: string,
  userAgent: string,
): Promise<string | null> {
  try {
    const parsedUrl = new URL(url);
    const robotsUrl = `${parsedUrl.protocol}//${parsedUrl.host}/robots.txt`;

    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": userAgent },
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
  } catch (error) {
    console.error(`Error fetching robots.txt: ${error.message}`);
    return null;
  }
}

async function canFetchUrl(url: string, userAgent: string): Promise<boolean> {
  const robotsTxt = await getRobotsTxt(url, userAgent);
  if (!robotsTxt) return true;

  // Simple robots.txt parsing
  const lines = robotsTxt
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !line.startsWith("#") && line.length > 0);

  let currentUserAgent = "*";
  let disallowedPaths: string[] = [];

  for (const line of lines) {
    const [directive, value] = line.split(":").map((s) => s.trim());

    if (directive.toLowerCase() === "user-agent") {
      currentUserAgent = value;
      if (currentUserAgent === "*" || userAgent.includes(currentUserAgent)) {
        disallowedPaths = [];
      }
    } else if (
      directive.toLowerCase() === "disallow" &&
      (currentUserAgent === "*" || userAgent.includes(currentUserAgent))
    ) {
      disallowedPaths.push(value);
    }
  }

  const parsedUrl = new URL(url);
  const path = parsedUrl.pathname + parsedUrl.search;

  return !disallowedPaths.some((disallowedPath) =>
    path.startsWith(disallowedPath.replace("*", "")),
  );
}

async function fetchAndExtractContent(
  url: string,
  userAgent: string,
): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL (status ${response.status})`);
    }

    const html = await response.text();
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (!article) {
      throw new Error("Failed to parse article content");
    }

    const turndownService = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    return turndownService.turndown(article.content);
  } catch (error) {
    throw new Error(`Error processing URL: ${error.message}`);
  }
}

// Tool definition
const fetchUrlTool: Tool = {
  id: "fetch_url",
  name: "Fetch URL",
  description:
    "Fetches a URL from the internet and extracts its contents as markdown. Respects robots.txt and includes proper user agent identification.",
  parameters: [
    {
      name: "url",
      type: "string",
      description: "URL to fetch",
      required: true,
    },
    {
      name: "ignoreRobotsTxt",
      type: "boolean",
      description: "Whether to ignore robots.txt restrictions",
      required: false,
      defaultValue: false,
    },
  ],
  returnType: "string",
  handler: async (params: any) => {
    const { url, ignoreRobotsTxt = false } = params;

    try {
      if (!ignoreRobotsTxt) {
        const canFetch = await canFetchUrl(url, DEFAULT_USER_AGENT);
        if (!canFetch) {
          throw new Error("URL access restricted by robots.txt");
        }
      }

      const content = await fetchAndExtractContent(url, DEFAULT_USER_AGENT);
      return `Contents of ${url}:\n\n${content}`;
    } catch (error) {
      throw new Error(`Failed to fetch URL: ${error.message}`);
    }
  },
};

const tools = [fetchUrlTool];

export { tools };
