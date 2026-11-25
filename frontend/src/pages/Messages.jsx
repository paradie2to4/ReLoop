import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CheckCheck, MessageCircle, Search, Send } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { fetchConversation, fetchConversations, sendMessage } from '../services/messaging'
import { apiErrorMessage } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useNotifications } from '../context/NotificationsContext'

const CHAT_POLL_MS = 5000
const LIST_POLL_MS = 15000

// A few avatar colours that read well in both light and dark mode.
const AVATAR_COLORS = [
  'bg-teal-600 text-on-accent',
  'bg-sky-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-violet-500 text-white',
  'bg-emerald-700 text-white',
]

function initials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase() || '?'
}

function Avatar({ name, id, size = 'md' }) {
  const color = AVATAR_COLORS[(Number(id) || 0) % AVATAR_COLORS.length]
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm' }
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full font-bold ${sizes[size]} ${color}`}>
      {initials(name)}
    </span>
  )
}

function shortTime(dateString) {
  if (!dateString) return ''
  const d = new Date(dateString)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dayLabel(dateString) {
  const d = new Date(dateString)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
}

export default function Messages() {
  const { id } = useParams()
  const { user } = useAuth()
  const { refresh: refreshNotifications } = useNotifications()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  const loadList = useCallback(() => fetchConversations().then(setConversations).catch(() => {}), [])

  useEffect(() => {
    loadList().finally(() => setLoading(false))
    const timer = setInterval(loadList, LIST_POLL_MS)
    return () => clearInterval(timer)
  }, [loadList])

  // Open a conversation, then keep it up to date while it stays open.
  useEffect(() => {
    if (!id) {
      setActive(null)
      return undefined
    }
    let cancelled = false
    async function load() {
      try {
        const data = await fetchConversation(id)
        if (cancelled) return
        setActive((prev) => {
          const prevLast = prev?.messages?.at(-1)
          const nextLast = data.messages.at(-1)
          const unchanged = prev && prev.id === data.id && prev.messages.length === data.messages.length &&
            prevLast?.id === nextLast?.id && prevLast?.is_read === nextLast?.is_read
          return unchanged ? prev : data
        })
        // Opening the chat marks it read, so clear its unread badge in the list.
        setConversations((list) => list.map((c) => (String(c.id) === String(id) ? { ...c, unread_count: 0 } : c)))
      } catch {
        // Keep showing what we have.
      }
    }
    setActive(null)
    load().then(() => refreshNotifications())
    const timer = setInterval(load, CHAT_POLL_MS)
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [id, refreshNotifications])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) => c.other_participant_name?.toLowerCase().includes(q) || c.product_title?.toLowerCase().includes(q),
    )
  }, [conversations, query])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-navy-900 sm:text-3xl">Messages</h1>
          <p className="mt-1 text-sm text-navy-600">Chat with buyers and sellers about their items.</p>
        </div>
      </div>

      <div className="glass-card mt-6 grid h-[calc(100vh-13rem)] min-h-[30rem] grid-cols-1 overflow-hidden rounded-3xl border border-sand-200 bg-surface lg:grid-cols-[340px_minmax(0,1fr)]">
        {/* Conversation list (hidden on phones while a chat is open) */}
        <aside className={`min-h-0 min-w-0 flex-col border-sand-200 lg:border-r ${id ? 'hidden lg:flex' : 'flex'}`}>
          <div className="border-b border-sand-200 p-3">
            <label className="flex items-center gap-2 rounded-xl border border-sand-200 bg-sand-50/60 px-3 py-2 focus-within:border-teal-500">
              <Search size={16} className="text-navy-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search people or items"
                aria-label="Search conversations"
                className="w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-500"
              />
            </label>
          </div>

          {!conversations.length ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <MessageCircle size={26} />
              </span>
              <p className="font-semibold text-navy-900">No conversations yet</p>
              <p className="text-sm text-navy-600">Message a seller from any product page to start chatting.</p>
              <Link to="/marketplace" className="mt-1 text-sm font-semibold text-teal-600 hover:underline">Browse the marketplace</Link>
            </div>
          ) : (
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {filtered.map((c) => {
                const selected = String(c.id) === id
                const unread = c.unread_count > 0 && !selected
                const mine = c.last_message?.sender === user.id
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => navigate(`/messages/${c.id}`)}
                      className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-colors ${
                        selected ? 'bg-teal-50 ring-1 ring-teal-200' : 'hover:bg-sand-100'
                      }`}
                    >
                      <Avatar name={c.other_participant_name} id={c.other_participant_id} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className={`truncate text-sm ${unread ? 'font-bold text-navy-900' : 'font-semibold text-navy-900'}`}>
                            {c.other_participant_name}
                          </span>
                          <span className={`shrink-0 text-[11px] ${unread ? 'font-semibold text-teal-600' : 'text-navy-500'}`}>
                            {shortTime(c.last_message?.created_at || c.updated_at)}
                          </span>
                        </span>
                        {c.product_title && <span className="block truncate text-xs font-medium text-teal-600">{c.product_title}</span>}
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span className={`truncate text-xs ${unread ? 'font-semibold text-navy-800' : 'text-navy-500'}`}>
                            {mine && 'You: '}
                            {c.last_message?.text}
                          </span>
                          {unread && (
                            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-teal-600 px-1.5 text-[10px] font-bold text-on-accent">
                              {c.unread_count}
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
              {!filtered.length && <li className="p-6 text-center text-sm text-navy-500">No conversations match “{query}”.</li>}
            </ul>
          )}
        </aside>

        {/* Chat */}
        <section className={`min-h-0 min-w-0 flex-col ${id ? 'flex' : 'hidden lg:flex'}`}>
          {!id ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
                <MessageCircle size={30} />
              </span>
              <p className="font-display text-lg font-bold text-navy-900">Your messages</p>
              <p className="max-w-xs text-sm text-navy-600">Choose a conversation on the left to read and reply.</p>
            </div>
          ) : !active ? (
            <div className="flex flex-1 items-center justify-center"><LoadingSpinner /></div>
          ) : (
            <Chat conversation={active} setConversation={setActive} userId={user.id} onSent={loadList} onBack={() => navigate('/messages')} />
          )}
        </section>
      </div>
    </div>
  )
}

function Chat({ conversation, setConversation, userId, onSent, onBack }) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const messages = conversation.messages
  const lastMine = [...messages].reverse().find((m) => m.sender === userId)

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages.length, conversation.id])

  useEffect(() => {
    inputRef.current?.focus()
  }, [conversation.id])

  async function handleSend(e) {
    e?.preventDefault()
    const body = text.trim()
    if (!body || sending) return
    setSending(true)
    setError('')
    // Show the message straight away; the next refresh replaces it with the saved one.
    const temp = { id: `temp-${Date.now()}`, sender: userId, text: body, created_at: new Date().toISOString(), is_read: false, pending: true }
    setConversation((c) => ({ ...c, messages: [...c.messages, temp] }))
    setText('')
    try {
      await sendMessage(conversation.id, body)
      setConversation(await fetchConversation(conversation.id))
      onSent()
    } catch (err) {
      setConversation((c) => ({ ...c, messages: c.messages.filter((m) => m.id !== temp.id) }))
      setText(body)
      setError(apiErrorMessage(err, 'Message not sent. Try again.'))
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      <header className="flex items-center gap-3 border-b border-sand-200 px-4 py-3">
        <button onClick={onBack} aria-label="Back to conversations" className="rounded-lg p-1.5 text-navy-700 hover:bg-sand-200 lg:hidden">
          <ArrowLeft size={20} />
        </button>
        <Avatar name={conversation.other_participant_name} id={conversation.other_participant_id} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-navy-900">{conversation.other_participant_name}</p>
          {conversation.product_title && <p className="truncate text-xs text-navy-500">About an item</p>}
        </div>
        {conversation.product_title && (
          <Link
            to={`/products/${conversation.product}`}
            className="flex max-w-[45%] items-center gap-2 rounded-xl border border-sand-200 bg-sand-50/60 p-1.5 pr-3 text-xs font-semibold text-navy-800 transition-colors hover:border-teal-400"
          >
            {conversation.product_image ? (
              <img src={conversation.product_image} alt="" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
            ) : (
              <span className="h-8 w-8 shrink-0 rounded-lg bg-sand-200" />
            )}
            <span className="truncate">{conversation.product_title}</span>
          </Link>
        )}
      </header>

      <div ref={scrollRef} className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-sand-100/40 px-4 py-5 sm:px-6">
        {messages.map((m, i) => {
          const mine = m.sender === userId
          const prev = messages[i - 1]
          const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
          const grouped = prev && !newDay && prev.sender === m.sender
          return (
            <Fragment key={m.id}>
              {newDay && (
                <div className="flex justify-center py-3">
                  <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-semibold text-navy-600 shadow-sm ring-1 ring-sand-200">
                    {dayLabel(m.created_at)}
                  </span>
                </div>
              )}
              <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${grouped ? '' : 'pt-2'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm sm:max-w-md ${
                    mine
                      ? 'rounded-br-md bg-teal-600 text-on-accent'
                      : 'rounded-bl-md border border-sand-200 bg-surface text-navy-900 dark:border-sand-300 dark:bg-navy-100'
                  } ${m.pending ? 'opacity-70' : ''}`}
                >
                  <p className="whitespace-pre-wrap break-words leading-relaxed">{m.text}</p>
                  <p className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${mine ? 'text-on-accent/75' : 'text-navy-500'}`}>
                    {m.pending ? 'Sending…' : shortTime(m.created_at)}
                    {mine && !m.pending && m.id === lastMine?.id && m.is_read && (
                      <span className="flex items-center gap-0.5"><CheckCheck size={12} /> Seen</span>
                    )}
                  </p>
                </div>
              </div>
            </Fragment>
          )
        })}
      </div>

      <form onSubmit={handleSend} className="border-t border-sand-200 p-3">
        {error && <p className="mb-2 px-1 text-xs text-red-600">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Write a message…"
            aria-label="Message"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-sand-300 bg-surface px-4 py-2.5 text-sm text-navy-900 outline-none placeholder:text-navy-500 focus:border-teal-500"
            style={{ height: Math.min(128, 44 + Math.max(0, text.split('\n').length - 1) * 20) }}
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            aria-label="Send message"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-600 text-on-accent transition-all hover:bg-teal-700 disabled:opacity-40"
          >
            <Send size={18} />
          </button>
        </div>
        <p className="mt-1.5 hidden px-1 text-[11px] text-navy-500 sm:block">Press Enter to send, Shift + Enter for a new line.</p>
      </form>
    </>
  )
}
