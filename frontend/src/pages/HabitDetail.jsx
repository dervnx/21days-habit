import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import dayjs from 'dayjs'

export default function HabitDetail() {
  const { id } = useParams()
  const [habit, setHabit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analysis, setAnalysis] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchHabit()
  }, [id])

  const fetchHabit = async () => {
    try {
      const response = await api.get(`/habits/${id}/`)
      setHabit(response.data)
      generateAnalysis(response.data)
    } catch (error) {
      console.error('获取习惯详情失败', error)
    } finally {
      setLoading(false)
    }
  }

  const generateAnalysis = (habitData) => {
    const checkins = habitData.checkins || []
    const completed = checkins.filter(c => c.status === 'completed')
    const total = checkins.length
    const completionRate = total > 0 ? Math.round((completed.length / total) * 100) : 0

    const analysisData = {
      totalDays: total,
      completedDays: completed.length,
      completionRate,
      streak: calculateStreak(checkins),
      advice: getAdvice(completionRate, calculateStreak(checkins))
    }
    setAnalysis(analysisData)
  }

  const calculateStreak = (checkins) => {
    if (!checkins || checkins.length === 0) return 0

    const sortedCheckins = [...checkins]
      .filter(c => c.status === 'completed')
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    let streak = 0
    let currentDate = dayjs()

    for (const checkin of sortedCheckins) {
      const checkinDate = dayjs(checkin.date)
      if (checkinDate.isSame(currentDate, 'day') || checkinDate.isSame(currentDate.subtract(1, 'day'), 'day')) {
        streak++
        currentDate = checkinDate
      } else {
        break
      }
    }

    return streak
  }

  const getAdvice = (completionRate, streak) => {
    if (completionRate === 0) {
      return '今天还没有打卡哦！赶紧开始你的21天挑战吧！'
    }
    if (completionRate < 30) {
      return '刚开始几天，坚持就是胜利！可以尝试设置每日提醒。'
    }
    if (completionRate < 60) {
      return '你已经完成了习惯养成的第一步！继续保持，当前连续打卡' + streak + '天。'
    }
    if (completionRate < 90) {
      return '太棒了！你已经养成了很好的习惯。注意保持规律作息。'
    }
    return '优秀！你已经养成了这个习惯。试着培养新的习惯吧！'
  }

  const handleCheckIn = async () => {
    try {
      await api.post('/habits/checkin/', { habit_id: id })
      fetchHabit()
    } catch (error) {
      console.error('打卡失败', error)
    }
  }

  const handleUndoCheckIn = async (date) => {
    try {
      await api.delete(`/habits/${id}/undo/?date=${date}`)
      fetchHabit()
    } catch (error) {
      console.error('撤销打卡失败', error)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm md:text-base">加载中...</div>
  }

  if (!habit) {
    return <div className="min-h-screen flex items-center justify-center text-sm md:text-base">习惯不存在</div>
  }

  const today = dayjs().format('YYYY-MM-DD')
  const isTodayChecked = habit.checkins?.some(c => c.date === today && c.status === 'completed')

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = dayjs().subtract(6 - i, 'day')
    return {
      date: date.format('YYYY-MM-DD'),
      dayName: date.format('dd'),
      checked: habit.checkins?.some(c => c.date === date.format('YYYY-MM-DD') && c.status === 'completed')
    }
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-3 md:py-4">
          <Link to="/" className="text-blue-500 hover:underline text-sm md:text-base">← 返回列表</Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
          <h1 className="text-xl md:text-2xl font-bold mb-2">{habit.name}</h1>
          <p className="text-gray-600 mb-4 text-sm md:text-base">{habit.description}</p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
            <div className="flex-1 w-full">
              <div className="text-sm text-gray-500 mb-1">完成进度</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-500 h-3 rounded-full transition-all"
                  style={{ width: `${analysis?.completionRate || 0}%` }}
                />
              </div>
              <div className="text-right text-sm mt-1">
                {analysis?.completedDays || 0} / 21 天 ({analysis?.completionRate || 0}%)
              </div>
            </div>
            <button
              onClick={handleCheckIn}
              disabled={isTodayChecked}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold ${
                isTodayChecked
                  ? 'bg-green-500 text-white cursor-default'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {isTodayChecked ? '已打卡' : '立即打卡'}
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 md:gap-2">
            {last7Days.map(day => (
              <div
                key={day.date}
                className={`text-center p-1 md:p-2 rounded ${
                  day.checked ? 'bg-green-100' : 'bg-gray-50'
                }`}
              >
                <div className="text-xs text-gray-500">{day.dayName}</div>
                <div className={`font-semibold text-sm md:text-base ${day.checked ? 'text-green-600' : 'text-gray-400'}`}>
                  {day.checked ? '✓' : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">数据分析</h2>
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-3 md:mb-4">
            <div className="text-center p-2 md:p-4 bg-blue-50 rounded">
              <div className="text-xl md:text-2xl font-bold text-blue-600">{analysis?.totalDays || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">总天数</div>
            </div>
            <div className="text-center p-2 md:p-4 bg-green-50 rounded">
              <div className="text-xl md:text-2xl font-bold text-green-600">{analysis?.streak || 0}</div>
              <div className="text-xs md:text-sm text-gray-600">连续打卡</div>
            </div>
            <div className="text-center p-2 md:p-4 bg-purple-50 rounded">
              <div className="text-xl md:text-2xl font-bold text-purple-600">{analysis?.completionRate || 0}%</div>
              <div className="text-xs md:text-sm text-gray-600">完成率</div>
            </div>
          </div>
          <div className="bg-yellow-50 p-3 md:p-4 rounded">
            <h3 className="font-semibold mb-1 md:mb-2 text-sm md:text-base">建议</h3>
            <p className="text-gray-700 text-sm">{analysis?.advice}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold mb-3 md:mb-4">打卡记录</h2>
          <div className="space-y-2">
            {(habit.checkins || []).length > 0 ? (
              [...habit.checkins].reverse().map(checkin => (
                <div key={checkin.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-2 border-b gap-2">
                  <span className="text-sm md:text-base">{checkin.date}</span>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-xs md:text-sm ${
                      checkin.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {checkin.status === 'completed' ? '已完成' : '未完成'}
                    </span>
                    {checkin.status === 'completed' && checkin.date === today && (
                      <button
                        onClick={() => handleUndoCheckIn(checkin.date)}
                        className="text-red-500 text-xs md:text-sm hover:underline"
                      >
                        撤销
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4 text-sm md:text-base">暂无打卡记录</p>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
