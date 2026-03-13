import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, Shield } from 'lucide-react'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

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
    try {
      await login(identifier, password, captchaKey, captchaCode)
      navigate('/')
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.captcha || '登录失败'
      setError(errorMsg)
      // 如果是邮箱未验证，不刷新验证码
      if (!err.response?.data?.email_verified) {
        fetchCaptcha()
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">21天好习惯</h1>
        <h2 className="text-lg md:text-xl text-center mb-4 md:mb-6">登录</h2>
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              用户名/邮箱
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入用户名或邮箱"
                required
              />
            </div>
          </div>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              验证码
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={captchaCode}
                  onChange={(e) => setCaptchaCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入验证码"
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
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
          >
            登录
          </button>
        </form>
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/register" className="text-blue-500 hover:underline">注册账号</Link>
          <Link to="/forgot-password" className="text-blue-500 hover:underline">忘记密码？</Link>
        </div>
      </div>
    </div>
  )
}
