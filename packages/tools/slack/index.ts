import { Tool } from '@aispec/tool-types';
import { WebClient } from '@slack/web-api';

class SlackClient {
  private botHeaders: { 'Authorization': string; 'Content-Type': string };
  private client: WebClient;

  constructor() {
    const token = process.env.SLACK_BOT_TOKEN;
    if (!token) {
      throw new Error('SLACK_BOT_TOKEN environment variable is not set');
    }
    this.botHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    this.client = new WebClient(token);
  }

  async addReaction(channel: string, timestamp: string, reaction: string) {
    return this.client.reactions.add({ channel, name: reaction, timestamp });
  }

  async getChannelHistory(channel: string, limit = 10) {
    return this.client.conversations.history({ channel, limit });
  }

  async getThreadReplies(channel: string, ts: string) {
    return this.client.conversations.replies({ channel, ts });
  }

  async getUserProfile(user: string) {
    return this.client.users.profile.get({ user });
  }

  async getUsers(limit?: number, cursor?: string) {
    return this.client.users.list({ cursor, limit });
  }

  async postMessage(channel: string, text: string) {
    return this.client.chat.postMessage({ channel, text });
  }

  async postReply(channel: string, thread_ts: string, text: string) {
    return this.client.chat.postMessage({ channel, text, thread_ts });
  }
}

const slackClient = new SlackClient();

const postMessageTool: Tool = {
  description: 'Post a new message to a Slack channel',
  handler: async (params: any) => {
    const response = await slackClient.postMessage(params.channel_id, params.text);
    return JSON.stringify(response);
  },
  id: 'slack_post_message',
  name: 'Slack Post Message',
  parameters: [
    {
      description: 'The ID of the channel to post to',
      name: 'channel_id',
      required: true,
      type: 'string',
    },
    {
      description: 'The message text to post',
      name: 'text',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const replyToThreadTool: Tool = {
  description: 'Reply to a specific message thread in Slack',
  handler: async (params: any) => {
    const response = await slackClient.postReply(params.channel_id, params.thread_ts, params.text);
    return JSON.stringify(response);
  },
  id: 'slack_reply_to_thread',
  name: 'Slack Reply to Thread',
  parameters: [
    {
      description: 'The ID of the channel containing the thread',
      name: 'channel_id',
      required: true,
      type: 'string',
    },
    {
      description: 'The timestamp of the parent message',
      name: 'thread_ts',
      required: true,
      type: 'string',
    },
    {
      description: 'The reply text',
      name: 'text',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const addReactionTool: Tool = {
  description: 'Add a reaction emoji to a message',
  handler: async (params: any) => {
    const response = await slackClient.addReaction(params.channel_id, params.timestamp, params.reaction);
    return JSON.stringify(response);
  },
  id: 'slack_add_reaction',
  name: 'Slack Add Reaction',
  parameters: [
    {
      description: 'The ID of the channel containing the message',
      name: 'channel_id',
      required: true,
      type: 'string',
    },
    {
      description: 'The timestamp of the message to react to',
      name: 'timestamp',
      required: true,
      type: 'string',
    },
    {
      description: 'The name of the emoji reaction (without ::)',
      name: 'reaction',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getChannelHistoryTool: Tool = {
  description: 'Get recent messages from a channel',
  handler: async (params: any) => {
    const response = await slackClient.getChannelHistory(params.channel_id, params.limit);
    return JSON.stringify(response);
  },
  id: 'slack_get_channel_history',
  name: 'Slack Get Channel History',
  parameters: [
    {
      description: 'The ID of the channel',
      name: 'channel_id',
      required: true,
      type: 'string',
    },
    {
      defaultValue: 10,
      description: 'Number of messages to retrieve (default 10)',
      name: 'limit',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const getThreadRepliesTool: Tool = {
  description: 'Get replies to a thread',
  handler: async (params: any) => {
    const response = await slackClient.getThreadReplies(params.channel_id, params.thread_ts);
    return JSON.stringify(response);
  },
  id: 'slack_get_thread_replies',
  name: 'Slack Get Thread Replies',
  parameters: [
    {
      description: 'The ID of the channel containing the thread',
      name: 'channel_id',
      required: true,
      type: 'string',
    },
    {
      description: 'The timestamp of the parent message',
      name: 'thread_ts',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const getUsersTool: Tool = {
  description: 'Get list of users in the workspace',
  handler: async (params: any) => {
    const response = await slackClient.getUsers(params.limit, params.cursor);
    return JSON.stringify(response);
  },
  id: 'slack_get_users',
  name: 'Slack Get Users',
  parameters: [
    {
      description: 'Pagination cursor for next page of results',
      name: 'cursor',
      required: false,
      type: 'string',
    },
    {
      description: 'Maximum number of users to return',
      name: 'limit',
      required: false,
      type: 'number',
    },
  ],
  returnType: 'string',
};

const getUserProfileTool: Tool = {
  description: 'Get a user\'s profile information',
  handler: async (params: any) => {
    const response = await slackClient.getUserProfile(params.user_id);
    return JSON.stringify(response);
  },
  id: 'slack_get_user_profile',
  name: 'Slack Get User Profile',
  parameters: [
    {
      description: 'The ID of the user',
      name: 'user_id',
      required: true,
      type: 'string',
    },
  ],
  returnType: 'string',
};

const tools = [
  postMessageTool,
  replyToThreadTool,
  addReactionTool,
  getChannelHistoryTool,
  getThreadRepliesTool,
  getUsersTool,
  getUserProfileTool,
];

export { tools };
