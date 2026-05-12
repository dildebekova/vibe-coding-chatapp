import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { MessageCircle } from 'lucide-react'
import axios from 'axios'

import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from || '/'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true })
  }, [isAuthenticated, from, navigate])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPending(true)
    try {
      await login(username, password)
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.detail
        toast.error(typeof msg === 'string' ? msg : 'Login failed')
      } else {
        toast.error('Login failed')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#141722] px-4 py-12">
      <div className="w-full max-w-md rounded-3xl bg-[#1a1d29] p-8 shadow-2xl ring-1 ring-white/5">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5d87ff]/15 text-[#5d87ff]">
            <MessageCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="mt-2 text-sm text-[#8b92a8]">Use your workspace credentials</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8b92a8]">Email or username</label>
            <input
              required
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-[#222635] px-4 py-3 text-sm text-white outline-none ring-1 ring-white/5 transition focus:ring-[#5d87ff]/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#8b92a8]">Password</label>
            <input
              required
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-[#222635] px-4 py-3 text-sm text-white outline-none ring-1 ring-white/5 transition focus:ring-[#5d87ff]/50"
            />
          </div>
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-xl bg-[#5d87ff] py-3 text-sm font-semibold text-white shadow-lg shadow-[#5d87ff]/25 transition hover:bg-[#4a74f0] disabled:opacity-50"
          >
            {pending ? 'Signing in…' : 'Continue'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#8b92a8]">
          No account?{' '}
          <Link to="/register" className="font-medium text-[#5d87ff] hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}
