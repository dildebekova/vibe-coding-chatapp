import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import axios from 'axios'
import { MessageCircle } from 'lucide-react'

import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    username: '',
    password: '',
    first_name: '',
    last_name: '',
  })
  const [file, setFile] = useState<File | null>(null)
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate('/', { replace: true })
  }, [isAuthenticated, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    try {
      await register({ ...form, uploaded_image: file })
      toast.success('Account created. You can sign in now.')
      navigate('/login')
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail
        toast.error(typeof msg === 'string' ? msg : 'Registration failed')
      } else {
        toast.error('Registration failed')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141722] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#1a1d29] p-8 shadow-2xl ring-1 ring-white/5">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5d87ff]/15 text-[#5d87ff]">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Create account</h1>
          <p className="mt-2 text-sm text-[#8b92a8]">Join your team on the chat workspace</p>
        </div>

        <form onSubmit={submit} className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-[#8b92a8]">First name</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className="w-full rounded-xl bg-[#222635] px-3 py-2.5 text-sm text-white ring-1 ring-white/5 outline-none focus:ring-[#5d87ff]/50"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-[#8b92a8]">Last name</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className="w-full rounded-xl bg-[#222635] px-3 py-2.5 text-sm text-white ring-1 ring-white/5 outline-none focus:ring-[#5d87ff]/50"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8b92a8]">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl bg-[#222635] px-3 py-2.5 text-sm text-white ring-1 ring-white/5 outline-none focus:ring-[#5d87ff]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8b92a8]">Username</label>
            <input
              required
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              className="w-full rounded-xl bg-[#222635] px-3 py-2.5 text-sm text-white ring-1 ring-white/5 outline-none focus:ring-[#5d87ff]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8b92a8]">Password (min 6)</label>
            <input
              required
              type="password"
              minLength={6}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full rounded-xl bg-[#222635] px-3 py-2.5 text-sm text-white ring-1 ring-white/5 outline-none focus:ring-[#5d87ff]/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-[#8b92a8]">Photo (optional)</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-[#8b92a8] file:mr-3 file:rounded-lg file:border-0 file:bg-[#222635] file:px-3 file:py-2 file:text-sm file:text-white"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="mt-2 w-full rounded-xl bg-[#5d87ff] py-3 text-sm font-semibold text-white shadow-lg shadow-[#5d87ff]/25 transition hover:bg-[#4a74f0] disabled:opacity-50"
          >
            {pending ? 'Creating…' : 'Register'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8b92a8]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[#5d87ff] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
