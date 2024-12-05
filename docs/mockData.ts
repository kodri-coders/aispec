interface ConversationItem {
  agent: string
  skills: string[]
  message: string
}

type Conversation = ConversationItem[]