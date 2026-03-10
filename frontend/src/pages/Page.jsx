import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { getArticle } from '../services/api'
import Header from '../components/Header'
import Footer from '../components/Footer'

export default function Page() {
  const { slug } = useParams()
  const [article, setArticle] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getArticle(slug)
      .then(res => {
        setArticle(res.data)
        // 设置SEO
        if (res.data.meta_title) {
          document.title = res.data.meta_title
        }
      })
      .catch(err => {
        setError(err.response?.data?.detail || '页面不存在')
      })
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">加载中...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-400 mb-4">404</h1>
            <p className="text-gray-500">{error}</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-4xl mx-auto px-3 md:px-4 py-6 md:py-8 w-full">
        <article>
          <h1 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6">{article.title}</h1>
          <div
            className="prose prose-sm md:prose max-w-none"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
