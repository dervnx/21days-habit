import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getSystemConfig } from '../services/api'

export default function Footer() {
  const [config, setConfig] = useState({
    site_name: '21天好习惯',
    icp_number: '',
    copyright: ''
  })

  useEffect(() => {
    getSystemConfig()
      .then(res => setConfig(res.data))
      .catch(err => console.error('获取系统配置失败', err))
  }, [])

  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-800 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* 版权信息 */}
          <div className="text-center md:text-left">
            <p className="text-sm">
              © {currentYear} {config.site_name}. All rights reserved.
            </p>
            {config.copyright && (
              <p className="text-xs mt-1">{config.copyright}</p>
            )}
          </div>

          {/* 链接 */}
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link to="/about" className="hover:text-white transition-colors">关于我们</Link>
            <Link to="/privacy" className="hover:text-white transition-colors">隐私政策</Link>
            <Link to="/agreement" className="hover:text-white transition-colors">用户协议</Link>
            <Link to="/contact" className="hover:text-white transition-colors">联系我们</Link>
          </div>
        </div>

        {/* 备案信息 */}
        {config.icp_number && (
          <div className="text-center mt-4 pt-4 border-t border-gray-700">
            <p className="text-xs">{config.icp_number}</p>
          </div>
        )}
      </div>
    </footer>
  )
}
