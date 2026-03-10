import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { encryptPassword } from '../services/api'
import { Lock, ArrowLeft } from 'lucide-react'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [invalidToken, setInvalidToken] = useState(false)

  useEffect(() => {
    if (!token) {
      setInvalidToken(true)
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 8) {
      setError('密码长度至少8位')
      return
    }

    setLoading(true)

    try {
      const encryptedPassword = encryptPassword(password)
      await api.post('/auth/password/reset/confirm/', {
        token,
        new_password: encryptedPassword,
        new_password_confirm: encryptedPassword
      })
      setSuccess(true)
    } catch (err) {
      const errorMsg = err.response?.data?.token?.[0] ||
        err.response?.data?.detail || '重置失败，请重试'
      setError(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  if (invalidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">重置密码</h1>
          <div className="text-center">
            <div className="text-red-500 text-4xl md:text-5xl mb-4">✕</div>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              重置链接无效或已过期
            </p>
            <Link to="/forgot-password" className="text-blue-500 hover:underline text-sm md:text-base">
              重新获取
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">重置密码</h1>
          <div className="text-center">
            <div className="text-green-500 text-4xl md:text-5xl mb-4">✓</div>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              密码重置成功
            </p>
            <Link to="/login" className="text-blue-500 hover:underline text-sm md:text-base">
              立即登录
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
        <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 text-sm md:text-base">
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">重置密码</h1>
        <h2 className="text-base md:text-lg text-center mb-4 md:mb-6 text-gray-600">请输入您的新密码</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              新密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入新密码"
                required
              />
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              确认新密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请确认新密码"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '提交中...' : '确认重置'}
          </button>
        </form>
      </div>
    </div>
  )
}
