import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Mail, Lock, User, Captcha, CheckCircle } from 'lucide-react'

export default function Register() {
  const [email, setEmail] = useState('')
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [captchaKey, setCaptchaKey] = useState('')
  const [captchaCode, setCaptchaCode] = useState('')
  const [captchaImage, setCaptchaImage] = useState('')
  const [error, setError] = useState('')
  const [registeredEmail, setRegisteredEmail] = useState('')
  const [registerSuccess, setRegisterSuccess] = useState(false)
  const { register } = useAuth()
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
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }
    try {
      const result = await register(email, nickname, password, confirmPassword, captchaKey, captchaCode)
      if (result.message) {
        setRegisterSuccess(true)
        setRegisteredEmail(result.email || email)
      }
    } catch (err) {
      const errorMsg = err.response?.data?.email?.[0] ||
        err.response?.data?.password_confirm?.[0] ||
        err.response?.data?.captcha?.[0] ||
        err.response?.data?.detail || '注册失败'
      setError(errorMsg)
      fetchCaptcha()
    }
  }

  if (registerSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold mb-4">注册成功</h1>
          <p className="text-gray-600 mb-4 text-sm md:text-base">
            账号已创建，请前往邮箱 <strong>{registeredEmail}</strong> 查看验证邮件
          </p>
          <p className="text-gray-500 text-sm mb-6">
            点击邮件中的链接完成邮箱验证后，即可登录账号
          </p>
          <Link
            to="/login"
            className="inline-block bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors"
          >
            去登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl md:text-2xl font-bold text-center mb-4 md:mb-6">21天好习惯</h1>
        <h2 className="text-lg md:text-xl text-center mb-4 md:mb-6">注册</h2>
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
                placeholder="请输入邮箱"
                required
              />
            </div>
          </div>
          <div className="mb-3 md:mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              昵称（可选）
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入昵称"
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
              确认密码
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请确认密码"
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
            注册
          </button>
        </form>
        <p className="mt-4 text-center text-gray-600 text-sm">
          已有账号？<Link to="/login" className="text-blue-500 hover:underline">登录</Link>
        </p>
      </div>
    </div>
  )
}
