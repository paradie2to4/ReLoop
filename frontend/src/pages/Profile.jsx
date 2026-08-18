import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import Select from '../components/ui/Select'
import Button from '../components/ui/Button'
import Rating from '../components/ui/Rating'
import * as authService from '../services/auth'
import { apiErrorMessage } from '../services/api'
import { LOCATIONS } from '../utils/constants'
import { formatDate } from '../utils/format'

export default function Profile() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user.full_name, phone: user.phone || '', location: user.location || '', bio: user.bio || '',
  })
  const [avatarFile, setAvatarFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      let payload
      if (avatarFile) {
        payload = new FormData()
        Object.entries(form).forEach(([k, v]) => payload.append(k, v))
        payload.append('avatar', avatarFile)
      } else {
        payload = form
      }
      await authService.updateProfile(payload)
      await refreshUser()
      setSuccess('Profile updated.')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update profile.'))
    } finally {
      setSaving(false)
    }
  }

  const stats = user.stats || {}

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-navy-900">My Profile</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-sand-200 bg-white p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-navy-900 text-xl font-semibold text-sand-50">
                {avatarFile ? (
                  <img src={URL.createObjectURL(avatarFile)} alt="" className="h-full w-full object-cover" />
                ) : user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  user.full_name?.[0]
                )}
              </div>
              <label className="cursor-pointer text-sm font-medium text-teal-600 hover:underline">
                Change photo
                <input type="file" accept="image/*" hidden onChange={(e) => setAvatarFile(e.target.files[0])} />
              </label>
            </div>

            <Input label="Full name" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} />
            <Input label="Email" value={user.email} disabled className="opacity-60" />
            <Input label="Phone" value={form.phone} onChange={(e) => update('phone', e.target.value)} />
            <Select label="Location" value={form.location} onChange={(e) => update('location', e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
            <Textarea label="Bio" value={form.bio} onChange={(e) => update('bio', e.target.value)} placeholder="Tell others a bit about yourself..." />

            {error && <p className="text-sm text-red-600">{error}</p>}
            {success && <p className="text-sm text-teal-700">{success}</p>}
            <Button type="submit" loading={saving}>
              Save changes
            </Button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-sand-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-navy-500">Member since</p>
            <p className="mt-1 text-sm font-medium text-navy-900">{formatDate(user.date_joined)}</p>
            <p className="mt-4 text-xs uppercase tracking-wide text-navy-500">Role</p>
            <p className="mt-1 text-sm font-medium capitalize text-navy-900">{user.role}</p>
            {stats.rating != null && (
              <>
                <p className="mt-4 text-xs uppercase tracking-wide text-navy-500">Rating</p>
                <Rating value={stats.rating} count={stats.review_count} />
              </>
            )}
          </div>
          <div className="rounded-lg border border-sand-200 bg-white p-5">
            <p className="text-xs uppercase tracking-wide text-navy-500">Activity</p>
            <dl className="mt-2 space-y-2 text-sm">
              <Row label="Items sold" value={stats.items_sold} />
              <Row label="Items donated" value={stats.items_donated} />
              <Row label="Items exchanged" value={stats.items_exchanged} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-navy-600">{label}</dt>
      <dd className="font-medium text-navy-900">{value ?? 0}</dd>
    </div>
  )
}
