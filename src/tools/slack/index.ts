import { WebClient } from "@slack/web-api";
import { Tool } from "../puppeteer/index.js";

class SlackClient {
  private botHeaders: { Authorization: string; "Content-Type": string };
  private client: WebClient;

  constructor() {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error("SLACK_BOT_TOKEN environment variable is not set");
    }
    this.botHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };
    this.client = new WebClient(token);
  }

  async postMessage(channel: string, text: string) {
    return this.client.chat.postMessage({ channel, text });
  }

  async postReply(channel: string, thread_ts: string, text: string) {
    return this.client.chat.postMessage({ channel, thread_ts, text });
  }

  async addReaction(channel: string, timestamp: string, reaction: string) {
    return this.client.reactions.add({ channel, timestamp, name: reaction });
  }

  async getChannelHistory(channel: string, limit = 10) {
    return this.client.conversations.history({ channel, limit });
  }

  async getThreadReplies(channel: string, ts: string) {
    return this.client.conversations.replies({ channel, ts });
  }

  async getUsers(limit?: number, cursor?: string) {
    return this.client.users.list({ limit, cursor });
  }

  async getUserProfile(user: string) {
    return this.client.users.profile.get({ user });
  }
}

const slackClient = new SlackClient();

const postMessageTool: Tool = {
  id: 'slack_post_message',
  name: 'Slack Post Message',
  description: 'Post a new message to a Slack channel',
  parameters: [
    {
      name: 'channel_id',
      type: 'string',
      description: 'The ID of the channel to post to',
      required: true,
    },
    {
      name: 'text',
      type: 'string',
      description: 'The message text to post',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.postMessage(params.channel_id, params.text);
    return JSON.stringify(response);
  },
};

const replyToThreadTool: Tool = {
  id: 'slack_reply_to_thread',
  name: 'Slack Reply to Thread',
  description: 'Reply to a specific message thread in Slack',
  parameters: [
    {
      name: 'channel_id',
      type: 'string',
      description: 'The ID of the channel containing the thread',
      required: true,
    },
    {
      name: 'thread_ts',
      type: 'string',
      description: 'The timestamp of the parent message',
      required: true,
    },
    {
      name: 'text',
      type: 'string',
      description: 'The reply text',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.postReply(params.channel_id, params.thread_ts, params.text);
    return JSON.stringify(response);
  },
};

const addReactionTool: Tool = {
  id: 'slack_add_reaction',
  name: 'Slack Add Reaction',
  description: 'Add a reaction emoji to a message',
  parameters: [
    {
      name: 'channel_id',
      type: 'string',
      description: 'The ID of the channel containing the message',
      required: true,
    },
    {
      name: 'timestamp',
      type: 'string',
      description: 'The timestamp of the message to react to',
      required: true,
    },
    {
      name: 'reaction',
      type: 'string',
      description: 'The name of the emoji reaction (without ::)',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.addReaction(params.channel_id, params.timestamp, params.reaction);
    return JSON.stringify(response);
  },
};

const getChannelHistoryTool: Tool = {
  id: 'slack_get_channel_history',
  name: 'Slack Get Channel History',
  description: 'Get recent messages from a channel',
  parameters: [
    {
      name: 'channel_id',
      type: 'string',
      description: 'The ID of the channel',
      required: true,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Number of messages to retrieve (default 10)',
      required: false,
      defaultValue: 10,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.getChannelHistory(params.channel_id, params.limit);
    return JSON.stringify(response);
  },
};

const getThreadRepliesTool: Tool = {
  id: 'slack_get_thread_replies',
  name: 'Slack Get Thread Replies',
  description: 'Get replies to a thread',
  parameters: [
    {
      name: 'channel_id',
      type: 'string',
      description: 'The ID of the channel containing the thread',
      required: true,
    },
    {
      name: 'thread_ts',
      type: 'string',
      description: 'The timestamp of the parent message',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.getThreadReplies(params.channel_id, params.thread_ts);
    return JSON.stringify(response);
  },
};

const getUsersTool: Tool = {
  id: 'slack_get_users',
  name: 'Slack Get Users',
  description: 'Get list of users in the workspace',
  parameters: [
    {
      name: 'cursor',
      type: 'string',
      description: 'Pagination cursor for next page of results',
      required: false,
    },
    {
      name: 'limit',
      type: 'number',
      description: 'Maximum number of users to return',
      required: false,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.getUsers(params.limit, params.cursor);
    return JSON.stringify(response);
  },
};

const getUserProfileTool: Tool = {
  id: 'slack_get_user_profile',
  name: 'Slack Get User Profile',
  description: 'Get a user\'s profile information',
  parameters: [
    {
      name: 'user_id',
      type: 'string',
      description: 'The ID of the user',
      required: true,
    }
  ],
  returnType: 'string',
  handler: async (params: any) => {
    const response = await slackClient.getUserProfile(params.user_id);
    return JSON.stringify(response);
  },
};

const tools = [
  postMessageTool,
  replyToThreadTool,
  addReactionTool,
  getChannelHistoryTool,
  getThreadRepliesTool,
  getUsersTool,
  getUserProfileTool
];

export { tools };
