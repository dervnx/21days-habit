import { createContext, useContext, useState, useEffect } from 'react'
import api, { encryptPassword } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = localStorage.getItem('token')
    if (token) {
      try {
        const response = await api.get('/auth/user/')
        setUser(response.data)
      } catch (error) {
        localStorage.removeItem('token')
      }
    }
    setLoading(false)
  }

  const login = async (identifier, password, captchaKey = '', captchaCode = '') => {
    const encryptedPassword = encryptPassword(password)
    const response = await api.post('/auth/login/', {
      username: identifier,
      password: encryptedPassword,
      captcha_key: captchaKey,
      captcha_code: captchaCode
    })
    localStorage.setItem('token', response.data.token)
    await checkAuth()
  }

  const register = async (email, nickname, password, password_confirm, captchaKey = '', captchaCode = '') => {
    const encryptedPassword = encryptPassword(password)
    const encryptedConfirm = encryptPassword(password_confirm)
    const response = await api.post('/auth/register/', {
      email,
      nickname,
      password: encryptedPassword,
      password_confirm: encryptedConfirm,
      captcha_key: captchaKey,
      captcha_code: captchaCode
    })
    // 注册成功后返回消息，不自动登录
    return response.data
  }

  const logout = async () => {
    await api.post('/auth/logout/')
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const response = await api.patch('/auth/user/', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    setUser(response.data)
    return response.data
  }

  const changePassword = async (oldPassword, newPassword) => {
    const encryptedOld = encryptPassword(oldPassword)
    const encryptedNew = encryptPassword(newPassword)
    const response = await api.post('/auth/password/change/', {
      old_password: encryptedOld,
      new_password: encryptedNew,
      new_password_confirm: encryptedNew
    })
    if (response.data.token) {
      localStorage.setItem('token', response.data.token)
    }
    return response.data
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, changePassword, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
