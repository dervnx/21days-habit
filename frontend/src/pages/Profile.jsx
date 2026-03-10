import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Mail, Camera, Lock, Check, X } from 'lucide-react'
import Header from '../components/Header'

export default function Profile() {
  const { user, updateProfile, changePassword, logout } = useAuth()
  const fileInputRef = useRef(null)

  const [nickname, setNickname] = useState(user?.nickname || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar, setAvatar] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar_url || null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAvatar(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess('')
    setError('')

    try {
      const formData = new FormData()
      if (nickname !== user?.nickname) formData.append('nickname', nickname)
      if (bio !== user?.bio) formData.append('bio', bio)
      if (avatar) formData.append('avatar', avatar)

      if (formData.keys().length > 0) {
        await updateProfile(formData)
        setSuccess('资料更新成功')
      }
    } catch (err) {
      setError(err.response?.data?.detail || '更新失败')
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (newPassword !== confirmPassword) {
      setPasswordError('两次输入的密码不一致')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('密码长度至少8位')
      return
    }

    try {
      await changePassword(oldPassword, newPassword)
      setPasswordSuccess('密码修改成功')
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err) {
      setPasswordError(err.response?.data?.old_password?.[0] || err.response?.data?.detail || '密码修改失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-2xl mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">个人资料</h1>

          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 flex items-center text-sm">
              <Check className="w-4 h-4 mr-2 flex-shrink-0" />
              {success}
            </div>
          )}

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 flex items-center text-sm">
              <X className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row items-center mb-4 md:mb-6 gap-4">
              <div className="relative">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 md:w-12 md:h-12 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-blue-500 text-white p-1.5 rounded-full"
                >
                  <Camera className="w-3 h-3 md:w-4 md:h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="text-center sm:text-left">
                <p className="text-base md:text-lg font-semibold">{user?.nickname || user?.username || user?.email}</p>
                <p className="text-sm text-gray-500">
                  {user?.is_email_verified ? (
                    <span className="text-green-500">已验证</span>
                  ) : (
                    <span className="text-orange-500">待验证</span>
                  )}
                </p>
              </div>
            </div>

            <div className="mb-3 md:mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                昵称
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded"
                  placeholder="请输入昵称"
                />
              </div>
            </div>

            <div className="mb-3 md:mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                邮箱
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email || ''}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded bg-gray-50"
                  disabled
                />
              </div>
            </div>

            <div className="mb-3 md:mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                个人简介
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                rows="3"
                placeholder="介绍一下你自己..."
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
              >
                保存
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 flex items-center justify-center w-full sm:w-auto"
              >
                <Lock className="w-4 h-4 mr-2" />
                修改密码
              </button>
            </div>
          </form>
        </div>

        {showPasswordForm && (
          <div className="bg-white rounded-lg shadow p-4 md:p-6">
            <h2 className="text-lg md:text-xl font-bold mb-4">修改密码</h2>

            {passwordError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 text-sm">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-3 md:px-4 py-2 md:py-3 rounded mb-3 md:mb-4 text-sm">
                {passwordSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordChange}>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  原密码
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  新密码
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
                >
                  确认修改
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 w-full sm:w-auto"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
