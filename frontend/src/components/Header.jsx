import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { User, Logout, Settings, ChevronDown, Menu, X } from 'lucide-react'

export default function Header() {
  const { user, logout } = useAuth()
  const [showMenu, setShowMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    setShowMobileMenu(false)
  }

  // 显示名称：优先显示昵称，然后是邮箱
  const displayName = user?.nickname || user?.email || '用户'

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-lg md:text-xl font-bold">21天好习惯</h1>

        {/* Mobile menu button */}
        {user && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
          >
            {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        )}

        {/* Desktop menu */}
        <div className="hidden md:flex items-center gap-4">
          {user && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 focus:outline-none"
              >
                {/* 头像 */}
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-4 h-4 text-gray-400" />
                  )}
                </div>
                <span>{displayName}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <div className="px-4 py-2 border-b text-sm text-gray-500 truncate">
                    {user.email}
                  </div>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    <User className="w-4 h-4 mr-2" />
                    我的资料
                  </Link>
                  {user.is_admin && (
                    <Link
                      to="/admin"
                      className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowMenu(false)}
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      管理后台
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                  >
                    <Logout className="w-4 h-4 mr-2" />
                    退出
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile menu dropdown */}
        {user && showMobileMenu && (
          <div className="absolute top-full left-0 right-0 bg-white shadow-lg md:hidden z-50">
            <div className="px-4 py-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt="头像" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-sm">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>
            </div>
            <div className="py-2">
              <Link
                to="/profile"
                className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                onClick={() => setShowMobileMenu(false)}
              >
                <User className="w-5 h-5 mr-3" />
                我的资料
              </Link>
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50"
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Settings className="w-5 h-5 mr-3" />
                  管理后台
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50"
              >
                <Logout className="w-5 h-5 mr-3" />
                退出
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
