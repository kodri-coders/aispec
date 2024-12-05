import puppeteer, { Browser, Page } from "puppeteer";

interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: {
    name: string;
    type: string;
    description: string;
    required: boolean;
    defaultValue?: any;
  }[];
  returnType: string;
  handler: (params: any) => Promise<string>;
}

// Global state
let browser: Browser | undefined;
let page: Page | undefined;
const screenshots = new Map<string, string>();

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
  id: 'puppeteer_navigate',
  name: 'Puppeteer Navigate',
  description: 'Navigate to a URL',
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'URL to navigate to',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.goto(params.url);
    return `Navigated to ${params.url}`;
  },
};

const screenshotTool: Tool = {
  id: 'puppeteer_screenshot',
  name: 'Puppeteer Screenshot',
  description: 'Take a screenshot of the current page or a specific element',
  parameters: [
    {
      name: 'name',
      type: 'string',
      description: 'Name for the screenshot',
      required: true,
    },
    {
      name: 'selector',
      type: 'string',
      description: 'CSS selector for element to screenshot',
      required: false,
    },
    {
      name: 'width',
      type: 'number',
      description: 'Width in pixels (default: 800)',
      required: false,
      defaultValue: 800,
    },
    {
      name: 'height',
      type: 'number',
      description: 'Height in pixels (default: 600)',
      required: false,
      defaultValue: 600,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const page = await ensureBrowser();

    await page.setViewport({
      width: params.width || 800,
      height: params.height || 600,
    });

    let element = null;
    if (params.selector) {
      element = await page.$(params.selector);
    }

    const screenshot = await (element || page).screenshot({
      encoding: "base64",
    });

    screenshots.set(params.name, screenshot);
    return `Screenshot saved as ${params.name}`;
  },
};

const clickTool: Tool = {
  id: 'puppeteer_click',
  name: 'Puppeteer Click',
  description: 'Click an element on the page',
  parameters: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS selector for element to click',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.click(params.selector);
    return `Clicked element: ${params.selector}`;
  },
};

const fillTool: Tool = {
  id: 'puppeteer_fill',
  name: 'Puppeteer Fill',
  description: 'Fill out an input field',
  parameters: [
    {
      name: 'selector',
      type: 'string',
      description: 'CSS selector for input field',
      required: true,
    },
    {
      name: 'value',
      type: 'string',
      description: 'Value to fill',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    await page.type(params.selector, params.value);
    return `Filled ${params.selector} with value`;
  },
};

const evaluateTool: Tool = {
  id: 'puppeteer_evaluate',
  name: 'Puppeteer Evaluate',
  description: 'Execute JavaScript in the browser console',
  parameters: [
    {
      name: 'script',
      type: 'string',
      description: 'JavaScript code to execute',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const page = await ensureBrowser();
    const result = await page.evaluate(params.script);
    return JSON.stringify(result);
  },
};

const tools = [
  navigateTool,
  screenshotTool,
  clickTool,
  fillTool,
  evaluateTool
];

export { Tool, tools };