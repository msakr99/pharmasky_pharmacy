"use client"

import NavBar from '../components/NavBar'
import { getToken } from '../lib/token-storage'
import { useEffect, useState } from 'react'

interface WishlistItem {
  id: number
  product: {
    id: number
    name: string
    e_name?: string
    public_price?: string
  }
  created_at: string
}

export default function ShortagesPage() {
  const [items, setItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const token = getToken()
        if (!token) {
          setError('يجب تسجيل الدخول')
          setLoading(false)
          return
        }
        const res = await fetch('/api/market/user/product-wishlist', {
          headers: { 'Authorization': `Token ${token}` }
        })
        if (!res.ok) {
          const txt = await res.text()
          console.error('Wishlist error:', txt)
          setError('تعذر جلب النواقص')
          setLoading(false)
          return
        }
        const data = await res.json()
        setItems(data.results || [])
      } catch (e) {
        setError('خطأ غير متوقع')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="p-3 sm:p-6 max-w-5xl mx-auto">
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">النواقص</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            الأصناف الناقصة لدى الصيدلية.
          </p>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-center h-24">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <div className="text-red-600 dark:text-red-400 mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">خطأ في تحميل البيانات</h3>
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <div className="text-gray-400 dark:text-gray-500 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">لا توجد نواقص</h3>
            <p className="text-gray-600 dark:text-gray-400">جميع الأصناف متوفرة حالياً</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    إجمالي النواقص: {items.length} صنف
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    تحتاج إلى إعادة توريد
                  </p>
                </div>
              </div>
            </div>

            {/* Items List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">قائمة النواقص</h2>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {items.map((item, index) => (
                  <div key={item.id} className="p-4 sm:p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base font-medium text-gray-900 dark:text-white">
                            {item.product.name}
                          </h3>
                          
                          {item.product.e_name && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {item.product.e_name}
                            </p>
                          )}
                          
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              أضيف في {new Date(item.created_at).toLocaleDateString('ar-EG')}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0 text-right">
                        {item.product.public_price && (
                          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                            {parseFloat(item.product.public_price).toLocaleString('ar-EG')} ج.م
                          </div>
                        )}
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                            ناقص
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


