import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MessageCircle, Send } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { fetchConversation, fetchConversations, sendMessage } from '../services/messaging'
import { timeAgo } from '../utils/format'
import { useAuth } from '../context/AuthContext'

export default function Messages() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [conversations, setConversations] = useState([])
  const [active, setActive] = useState(null)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    fetchConversations().then(setConversations).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!id) return setActive(null)
    fetchConversation(id).then(setActive)
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages?.length])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim()) return
    setSending(true)
    try {
      await sendMessage(id, text)
      setText('')
      const updated = await fetchConversation(id)
      setActive(updated)
      setConversations(await fetchConversations())
    } finally {
      setSending(false)
    }
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-navy-900">Messages</h1>
      <div className="mt-6 grid gap-4 rounded-lg border border-sand-200 bg-white lg:grid-cols-3" style={{ minHeight: '28rem' }}>
        <div className="border-sand-200 lg:col-span-1 lg:border-r">
          {!conversations.length ? (
            <EmptyState icon={MessageCircle} title="No conversations yet" description="Message a seller from a product page to start chatting." />
          ) : (
            <ul className="divide-y divide-sand-100">
              {conversations.map((c) => (
                <li key={c.id}>
                  <button
                    onClick={() => navigate(`/messages/${c.id}`)}
                    className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-sand-50 ${
                      String(c.id) === id ? 'bg-sand-100' : ''
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="text-sm font-medium text-navy-900">{c.other_participant_name}</span>
                      {c.unread_count > 0 && <span className="h-2 w-2 rounded-full bg-teal-500" />}
                    </div>
                    {c.product_title && <span className="text-xs text-teal-600">Re: {c.product_title}</span>}
                    <span className="truncate text-xs text-navy-500">{c.last_message?.text}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-col lg:col-span-2">
          {!active ? (
            <div className="flex flex-1 items-center justify-center text-sm text-navy-500">Select a conversation</div>
          ) : (
            <>
              <div className="border-b border-sand-200 px-4 py-3">
                <p className="text-sm font-medium text-navy-900">{active.other_participant_name}</p>
                {active.product_title && (
                  <Link to={`/products/${active.product}`} className="text-xs text-teal-600 hover:underline">
                    Re: {active.product_title}
                  </Link>
                )}
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {active.messages.map((m) => (
                  <div key={m.id} className={`flex ${m.sender === user.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs rounded-lg px-3.5 py-2 text-sm ${m.sender === user.id ? 'bg-navy-900 text-sand-50' : 'bg-sand-100 text-navy-900'}`}>
                      <p>{m.text}</p>
                      <p className={`mt-1 text-[10px] ${m.sender === user.id ? 'text-sand-200' : 'text-navy-500'}`}>{timeAgo(m.created_at)}</p>
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-sand-200 p-3">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-md border border-sand-300 px-3 py-2 text-sm focus:border-teal-500"
                />
                <button type="submit" disabled={sending} className="rounded-md bg-teal-600 p-2.5 text-white disabled:opacity-50">
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
