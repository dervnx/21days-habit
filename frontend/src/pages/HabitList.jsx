import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import dayjs from 'dayjs'
import Header from '../components/Header'

export default function HabitList() {
  const [habits, setHabits] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newHabit, setNewHabit] = useState({ name: '', description: '' })
  const { user } = useAuth()

  useEffect(() => {
    fetchHabits()
  }, [])

  const fetchHabits = async () => {
    try {
      const response = await api.get('/habits/')
      setHabits(response.data)
    } catch (error) {
      console.error('获取习惯列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHabit = async (e) => {
    e.preventDefault()
    try {
      await api.post('/habits/', newHabit)
      setNewHabit({ name: '', description: '' })
      setShowForm(false)
      fetchHabits()
    } catch (error) {
      console.error('创建习惯失败', error)
    }
  }

  const handleDeleteHabit = async (id) => {
    if (!confirm('确定要删除这个习惯吗？')) return
    try {
      await api.delete(`/habits/${id}/`)
      fetchHabits()
    } catch (error) {
      console.error('删除习惯失败', error)
    }
  }

  const getCompletionRate = (habit) => {
    if (!habit.checkins || habit.checkins.length === 0) return 0
    const completed = habit.checkins.filter(c => c.status === 'completed').length
    return Math.round((completed / 21) * 100)
  }

  const isTodayChecked = (habit) => {
    const today = dayjs().format('YYYY-MM-DD')
    return habit.checkins?.some(c => c.date === today)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm md:text-base">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-3 md:px-4 py-6 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold">我的习惯</h2>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 text-sm md:text-base w-full sm:w-auto"
          >
            {showForm ? '取消' : '添加习惯'}
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-4 md:p-6 rounded-lg shadow mb-4 md:mb-6">
            <form onSubmit={handleCreateHabit}>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  习惯名称
                </label>
                <input
                  type="text"
                  value={newHabit.name}
                  onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  required
                />
              </div>
              <div className="mb-3 md:mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  描述
                </label>
                <textarea
                  value={newHabit.description}
                  onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded"
                  rows="2"
                />
              </div>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 w-full sm:w-auto"
              >
                创建
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {habits.map(habit => (
            <div key={habit.id} className="bg-white p-4 md:p-6 rounded-lg shadow">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-base md:text-lg font-semibold truncate flex-1">{habit.name}</h3>
                {isTodayChecked(habit) && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-2 flex-shrink-0">已完成</span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">{habit.description}</p>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>完成进度</span>
                  <span>{getCompletionRate(habit)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${getCompletionRate(habit)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {habit.checkins?.filter(c => c.status === 'completed').length || 0} / 21 天
                </p>
              </div>
              <div className="flex gap-2">
                <Link
                  to={`/habit/${habit.id}`}
                  className="flex-1 bg-blue-500 text-white text-center py-2 rounded hover:bg-blue-600 text-sm"
                >
                  查看详情
                </Link>
                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className="bg-red-500 text-white px-3 py-2 rounded hover:bg-red-600 text-sm"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>

        {habits.length === 0 && (
          <div className="text-center text-gray-500 py-8 md:py-12 text-sm md:text-base">
            还没有习惯，添加一个开始你的21天挑战吧！
          </div>
        )}
      </main>
    </div>
  )
}
