import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api, { encryptPassword } from '../services/api'
import { Mail, Captcha, ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCaptcha()
  }, [])

  const fetchCaptcha = async () => {
    try {
      const response = await fetch('/api/auth/captcha/')
      const data = await response.json()
      setCaptchaKey(data.key)
      setCaptchaImage(data.image_url)
    } catch (err) {
      console.error('获取验证码失败', err)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const encryptedPassword = encryptPassword('dummy')
      await api.post('/auth/password/reset/', {
        email,
        captcha_key: captchaKey,
        captcha_code: captchaCode
      })
      setSuccess(true)
    } catch (err) {
      const errorMsg = err.response?.data?.email?.[0] ||
        err.response?.data?.captcha?.[0] ||
        err.response?.data?.detail || '发送失败，请重试'
      setError(errorMsg)
      fetchCaptcha()
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
          <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">找回密码</h1>
          <div className="text-center">
            <div className="text-green-500 text-4xl md:text-5xl mb-4">✓</div>
            <p className="text-gray-600 mb-4 text-sm md:text-base">
              如果邮箱 {email} 存在，您将收到密码重置邮件
            </p>
            <Link to="/login" className="text-blue-500 hover:underline text-sm md:text-base">
              返回登录
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
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">找回密码</h1>
        <h2 className="text-base md:text-lg text-center mb-4 md:mb-6 text-gray-600">请输入您的注册邮箱</h2>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入注册邮箱"
                required
              />
            </div>
          </div>

          <div className="mb-4 md:mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              验证码
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Captcha className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入验证码"
                  required
                />
              </div>
              {captchaImage && (
                <img
                  src={captchaImage}
                  alt="验证码"
                  className="h-10 cursor-pointer"
                  onClick={fetchCaptcha}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? '发送中...' : '发送重置邮件'}
          </button>
        </form>
      </div>
    </div>
  )
}
