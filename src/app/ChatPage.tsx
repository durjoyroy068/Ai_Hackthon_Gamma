import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useChatStore } from '@/features/stores'
import { apiStreamChat, apiCreateConversation } from '@/lib/api'
import type { ChatMessage, Conversation } from '@/types'
import { TopNav } from '@/components/TopNav'
import {
  MessageList,
  ChatWelcome,
  ChatComposer,
} from '@/components/chat/ChatInterface'

export function ChatPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const {
    conversations,
    activeConversationId,
    setActiveConversation,
    addConversation,
    updateConversation,
    isStreaming,
    setStreaming,
  } = useChatStore()
  const [streamingContent, setStreamingContent] = useState('')
  const [abortController, setAbortController] = useState<AbortController | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!id) {
      setActiveConversation(null)
    } else if (id !== activeConversationId) {
      setActiveConversation(id)
    }
  }, [id, activeConversationId, setActiveConversation])

  const conversation = id
    ? conversations.find((c) => c.id === id)
    : null

  const isEmpty = !conversation || conversation.messages.filter((m) => m.content).length === 0

  const ensureConversation = useCallback(async (): Promise<Conversation> => {
    if (conversation) return conversation
    if (creating) throw new Error('Creating conversation')

    setCreating(true)
    try {
      const newConv = await apiCreateConversation(t('nav.newChat'))
      addConversation(newConv)
      setActiveConversation(newConv.id)
      navigate(`/app/chat/${newConv.id}`, { replace: true })
      return newConv
    } finally {
      setCreating(false)
    }
  }, [conversation, creating, addConversation, setActiveConversation, navigate, t])

  const handleSend = async (content: string) => {
    let conv: Conversation
    try {
      conv = await ensureConversation()
    } catch {
      return
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    updateConversation(conv.id, {
      messages: [...conv.messages, userMsg],
      title: conv.messages.length === 0 ? content.slice(0, 40) : conv.title,
    })

    setStreaming(true)
    setStreamingContent('')
    const controller = new AbortController()
    setAbortController(controller)

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    }

    try {
      const result = await apiStreamChat(conv.id, content, (chunk) => {
        if (!controller.signal.aborted) setStreamingContent(chunk)
      })

      if (!controller.signal.aborted) {
        const userWithSafety = {
          ...userMsg,
          id: result.userMessage.id,
          safetyLevel: result.userMessage.safetyLevel,
        }
        updateConversation(conv.id, {
          messages: [
            ...conv.messages,
            userWithSafety,
            { ...assistantMsg, id: result.assistantMessage.id, content: result.responseText },
          ],
          title: conv.messages.length === 0 ? content.slice(0, 40) : conv.title,
        })
      }
    } catch {
      toast.error(t('common.error'))
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setAbortController(null)
    }
  }

  const handleStop = () => {
    abortController?.abort()
    setStreaming(false)
    setStreamingContent('')
  }

  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col overflow-hidden">
        {isEmpty && !isStreaming ? (
          <ChatWelcome onSuggestionClick={handleSend} />
        ) : (
          <MessageList
            messages={conversation?.messages.filter((m) => m.content) ?? []}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        )}
        <ChatComposer onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />
      </main>
    </>
  )
}
