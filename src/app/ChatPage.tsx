import { useState, useCallback, useEffect, useRef } from 'react'
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
  const sendingRef = useRef(false)

  // Clear any stuck streaming lock from older persisted sessions.
  useEffect(() => {
    setStreaming(false)
    setStreamingContent('')
  }, [setStreaming])

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

  const visibleMessages = conversation?.messages.filter((m) => m.content) ?? []
  const isEmpty = visibleMessages.length === 0

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
    if (sendingRef.current || isStreaming) return
    sendingRef.current = true

    let conv: Conversation
    try {
      conv = await ensureConversation()
    } catch {
      sendingRef.current = false
      toast.error(t('chat.errorRetry'))
      return
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    }

    const baseMessages = [...(useChatStore.getState().conversations.find((c) => c.id === conv.id)?.messages ?? conv.messages)]

    updateConversation(conv.id, {
      messages: [...baseMessages, userMsg],
      title: baseMessages.length === 0 ? content.slice(0, 40) : conv.title,
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
        const latest = useChatStore.getState().conversations.find((c) => c.id === conv.id)
        const withoutTemp = (latest?.messages ?? baseMessages).filter(
          (m) => m.id !== userMsg.id && m.id !== assistantMsg.id
        )
        updateConversation(conv.id, {
          messages: [
            ...withoutTemp,
            {
              ...userMsg,
              id: result.userMessage.id,
              safetyLevel: result.userMessage.safetyLevel,
            },
            {
              ...assistantMsg,
              id: result.assistantMessage.id,
              content: result.responseText,
            },
          ],
          title: baseMessages.length === 0 ? content.slice(0, 40) : conv.title,
        })
      }
    } catch {
      toast.error(t('chat.errorRetry'))
      // Keep the user's message even if the assistant reply fails.
      const latest = useChatStore.getState().conversations.find((c) => c.id === conv.id)
      if (latest && !latest.messages.some((m) => m.id === userMsg.id || m.content === content)) {
        updateConversation(conv.id, {
          messages: [...latest.messages, userMsg],
        })
      }
    } finally {
      setStreaming(false)
      setStreamingContent('')
      setAbortController(null)
      sendingRef.current = false
    }
  }

  const handleStop = () => {
    abortController?.abort()
    setStreaming(false)
    setStreamingContent('')
    sendingRef.current = false
  }

  return (
    <>
      <TopNav />
      <main className="flex flex-1 flex-col overflow-hidden">
        {isEmpty && !isStreaming ? (
          <ChatWelcome onSuggestionClick={handleSend} />
        ) : (
          <MessageList
            messages={visibleMessages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
          />
        )}
        <ChatComposer onSend={handleSend} onStop={handleStop} isStreaming={isStreaming} />
      </main>
    </>
  )
}
