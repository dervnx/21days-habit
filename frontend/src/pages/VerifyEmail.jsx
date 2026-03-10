import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import api from '../services/api'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState('loading') // loading, success, error
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (token) {
      verifyEmail()
    } else {
      setStatus('error')
      setMessage('验证链接无效')
    }
  }, [token])

  const verifyEmail = async () => {
    try {
      const response = await api.post('/auth/verify-email/', { token })
      setStatus('success')
      setMessage(response.data.detail || '邮箱验证成功')
    } catch (err) {
      setStatus('error')
      setMessage(err.response?.data?.token || err.response?.data?.detail || '验证失败')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600 text-sm md:text-base">正在验证邮箱...</p>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
        <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm text-center">
          <CheckCircle className="w-12 h-12 md:w-16 md:h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl md:text-2xl font-bold mb-4">验证成功</h1>
          <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{message}</p>
          <Link
            to="/login"
            className="inline-block bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors text-sm md:text-base"
          >
            立即登录
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-8">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-sm text-center">
        <XCircle className="w-12 h-12 md:w-16 md:h-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl md:text-2xl font-bold mb-4">验证失败</h1>
        <p className="text-gray-600 mb-4 md:mb-6 text-sm md:text-base">{message}</p>
        <div className="space-y-3">
          <Link
            to="/login"
            className="block bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-600 transition-colors text-sm md:text-base"
          >
            返回登录
          </Link>
          <Link
            to="/register"
            className="block text-blue-500 hover:underline text-sm md:text-base"
          >
            重新注册
          </Link>
        </div>
      </div>
    </div>
  )
}
