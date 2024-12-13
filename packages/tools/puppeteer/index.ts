import puppeteer, { Browser, Page } from 'puppeteer';

interface Tool {
  description: string;
  handler: (params: any) => Promise<string>;
  id: string;
  name: string;
  parameters: {
    defaultValue?: any;
    description: string;
    name: string;
    required: boolean;
    type: string;
  }[];
  returnType: string;
}

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const screenshots = new Map<string, string>();

/**
 *
 */
async function ensureBrowser(): Promise<Page> {
  if (!browser) {
    browser = await puppeteer.launch();
  }
  if (!page) {
    page = await browser.newPage();
  }
  return page;
}

const navigateTool: Tool = {
  description: 'Navigate to a URL',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.goto(params.url);
    return `Navigated to ${params.url}`;
  },
  id: 'puppeteer_navigate',
  name: 'Puppeteer Navigate',
  parameters: [
    {
      description: 'URL to navigate to',
      name: 'url',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const screenshotTool: Tool = {
  description: 'Take a screenshot of the current page or a specific element',
  handler: async (params: any) => {
    const page = await ensureBrowser();

    await page.setViewport({
      height: params.height || 600,
      width: params.width || 800,
    });

    let element = null;
    if (params.selector) {
      element = await page.$(params.selector);
    }

    const screenshot = await (element || page).screenshot({
      encoding: 'base64',
    });

    screenshots.set(params.name, screenshot);
    return `Screenshot saved as ${params.name}`;
  },
  id: 'puppeteer_screenshot',
  name: 'Puppeteer Screenshot',
  parameters: [
    {
      description: 'Name for the screenshot',
      name: 'name',
      required: true,
      type: 'string',
    },
    {
      description: 'CSS selector for element to screenshot',
      name: 'selector',
      required: false,
      type: 'string',
    },
    {
      defaultValue: 800,
      description: 'Width in pixels (default: 800)',
      name: 'width',
      required: false,
      type: 'number',
    },
    {
      defaultValue: 600,
      description: 'Height in pixels (default: 600)',
      name: 'height',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const clickTool: Tool = {
  description: 'Click an element on the page',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.click(params.selector);
    return `Clicked element: ${params.selector}`;
  },
  id: 'puppeteer_click',
  name: 'Puppeteer Click',
  parameters: [
    {
      description: 'CSS selector for element to click',
      name: 'selector',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const fillTool: Tool = {
  description: 'Fill out an input field',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.type(params.selector, params.value);
    return `Filled ${params.selector} with value`;
  },
  id: 'puppeteer_fill',
  name: 'Puppeteer Fill',
  parameters: [
    {
      description: 'CSS selector for input field',
      name: 'selector',
      required: true,
      type: 'string',
    },
    {
      description: 'Value to fill',
      name: 'value',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const evaluateTool: Tool = {
  description: 'Execute JavaScript in the browser console',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    const result = await page.evaluate(params.script);
    return JSON.stringify(result);
  },
  id: 'puppeteer_evaluate',
  name: 'Puppeteer Evaluate',
  parameters: [
    {
      description: 'JavaScript code to execute',
      name: 'script',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [
  navigateTool,
  screenshotTool,
  clickTool,
  fillTool,
  evaluateTool,
];

export { Tool, tools };
