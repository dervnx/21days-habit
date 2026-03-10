import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total_users: 0,
    total_habits: 0,
    total_checkins: 0,
    completion_rate: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats/')
      setStats(response.data)
    } catch (error) {
      console.error('获取统计数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">管理后台</h1>
          <div className="flex gap-4">
            <Link to="/" className="text-gray-600 hover:text-gray-900">前台首页</Link>
            <Link to="/admin/users" className="text-gray-600 hover:text-gray-900">用户管理</Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">数据统计</h2>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">用户总数</div>
            <div className="text-3xl font-bold text-blue-600">{stats.total_users}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">习惯总数</div>
            <div className="text-3xl font-bold text-green-600">{stats.total_habits}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">打卡记录</div>
            <div className="text-3xl font-bold text-purple-600">{stats.total_checkins}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500 text-sm mb-1">平均完成率</div>
            <div className="text-3xl font-bold text-orange-600">{stats.completion_rate}%</div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">系统概览</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              to="/admin/users"
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <h4 className="font-semibold mb-2">用户列表</h4>
              <p className="text-gray-600 text-sm">查看和管理所有用户</p>
            </Link>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">习惯列表</h4>
              <p className="text-gray-600 text-sm">查看所有用户的习惯</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">打卡记录</h4>
              <p className="text-gray-600 text-sm">查看所有打卡记录</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">完成统计</h4>
              <p className="text-gray-600 text-sm">习惯完成率统计</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
