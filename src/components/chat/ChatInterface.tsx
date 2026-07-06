import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Copy,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Share2,
  Square,
  Phone,
} from 'lucide-react'
import toast from 'react-hot-toast'
import type { ChatMessage } from '@/types'
import { BrandMark } from '@/components/AlponaThread'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { EMERGENCY_RESOURCES } from '@/lib/assessment-data'

interface MessageListProps {
  messages: ChatMessage[]
  isStreaming?: boolean
  streamingContent?: string
}

function SafetyCard() {
  const { t } = useTranslation()
  return (
    <div className="my-4 rounded-xl border border-alert/30 bg-alert-soft p-4 dark:bg-alert/10">
      <p className="mb-3 text-sm font-medium text-alert">{t('chat.safety.title')}</p>
      <p className="mb-3 text-sm text-muted">{t('chat.safety.description')}</p>
      <div className="flex flex-wrap gap-2">
        {EMERGENCY_RESOURCES.slice(0, 2).map((r) => (
          <Button key={r.id} asChild size="sm" variant="destructive">
            <a href={`tel:${r.phone}`}>
              <Phone className="h-3 w-3" />
              {t(r.nameKey)} — {r.phone}
            </a>
          </Button>
        ))}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-2" aria-label="Typing">
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
      <span className="typing-dot h-2 w-2 rounded-full bg-muted" />
    </div>
  )
}

function AssistantMessage({ message }: { message: ChatMessage }) {
  const { t } = useTranslation()
  const [liked, setLiked] = useState<boolean | null>(message.liked ?? null)

  const copyContent = () => {
    navigator.clipboard.writeText(message.content)
    toast.success(t('common.success'))
  }

  return (
    <article className="group mb-8 max-w-3xl" aria-label="Assistant message">
      <div className="mb-2 flex items-center gap-2">
        <BrandMark className="h-6 w-6" />
        <span className="text-xs font-medium text-muted">{t('common.appName')}</span>
      </div>
      <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
      </div>
      {message.safetyLevel && message.safetyLevel !== 'none' && <SafetyCard />}
      <div className="mt-3 flex flex-wrap gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
        <Button variant="ghost" size="sm" onClick={copyContent} aria-label={t('chat.copy')}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" aria-label={t('chat.regenerate')}>
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLiked(true)}
          className={liked === true ? 'text-peacock' : ''}
          aria-label={t('chat.like')}
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLiked(false)}
          className={liked === false ? 'text-alert' : ''}
          aria-label={t('chat.dislike')}
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="sm" aria-label={t('chat.share')}>
          <Share2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </article>
  )
}

function UserMessage({ message }: { message: ChatMessage }) {
  return (
    <article className="mb-6 flex justify-end" aria-label="Your message">
      <div className="max-w-[80%] rounded-2xl rounded-br-md bg-dusk px-4 py-3 text-sm text-white">
        {message.content}
      </div>
    </article>
  )
}

export function MessageList({ messages, isStreaming, streamingContent }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const { t } = useTranslation()

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div
      className="flex-1 overflow-y-auto px-4 py-6 md:px-8"
      role="log"
      aria-live="polite"
      aria-relevant="additions"
    >
      {messages.map((msg) =>
        msg.role === 'user' ? (
          <UserMessage key={msg.id} message={msg} />
        ) : msg.content ? (
          <AssistantMessage key={msg.id} message={msg} />
        ) : null
      )}
      {isStreaming && streamingContent && (
        <article className="mb-8 max-w-3xl">
          <div className="mb-2 flex items-center gap-2">
            <BrandMark className="h-6 w-6" />
            <span className="text-xs font-medium text-muted">{t('common.appName')}</span>
          </div>
          <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
          </div>
        </article>
      )}
      {isStreaming && !streamingContent && <TypingIndicator />}
      <div ref={bottomRef} />
    </div>
  )
}

export function ChatWelcome({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  const { t } = useTranslation()
  const suggestions = ['suggestion1', 'suggestion2', 'suggestion3', 'suggestion4'] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex flex-1 flex-col items-center justify-center px-4 py-12 text-center"
    >
      <BrandMark className="mb-6 h-12 w-12" />
      <h1 className="font-display max-w-lg text-2xl leading-relaxed md:text-3xl">
        {t('chat.welcome')}
      </h1>
      <p className="mt-4 max-w-md text-muted">{t('chat.welcomeSub')}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-2">
        {suggestions.map((key) => (
          <button
            key={key}
            onClick={() => onSuggestionClick(t(`chat.${key}`))}
            className="rounded-full border border-border bg-paper px-4 py-2 text-sm transition-all duration-300 hover:border-peacock hover:bg-peacock-soft dark:bg-surface"
          >
            {t(`chat.${key}`)}
          </button>
        ))}
      </div>
    </motion.div>
  )
}

export function ChatComposer({
  onSend,
  onStop,
  isStreaming,
}: {
  onSend: (message: string) => void
  onStop?: () => void
  isStreaming?: boolean
}) {
  const { t } = useTranslation()
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSubmit = () => {
    if (!value.trim() || isStreaming) return
    onSend(value.trim())
    setValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="border-t border-border bg-paper/80 p-4 backdrop-blur-sm dark:bg-surface/80">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border bg-paper p-2 shadow-sm dark:bg-surface">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('chat.placeholder')}
          rows={1}
          className="chat-composer__input max-h-32 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-3 py-2.5 text-sm shadow-none focus:outline-none focus-visible:outline-none"
          aria-label={t('chat.placeholder')}
        />
        {isStreaming ? (
          <Button onClick={onStop} variant="outline" size="icon" aria-label={t('chat.stop')}>
            <Square className="h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={!value.trim()}
            className="shrink-0"
            aria-label={t('chat.send')}
          >
            {t('chat.send')}
          </Button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl text-center text-xs text-muted">{t('chat.disclaimer')}</p>
    </div>
  )
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 space-y-6 p-8" aria-busy="true" aria-label="Loading chat">
      {[1, 2, 3].map((i) => (
        <div key={i} className={cn('animate-pulse', i % 2 === 0 ? 'flex justify-end' : '')}>
          <div
            className={cn(
              'h-16 rounded-2xl bg-mist dark:bg-dusk-2',
              i % 2 === 0 ? 'w-1/2' : 'w-2/3'
            )}
          />
        </div>
      ))}
    </div>
  )
}
