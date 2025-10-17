"use client"

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../lib/token-storage'
import NavBar from '../components/NavBar'

export default function OffersPage() {
  const router = useRouter()
  const [offers, setOffers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [paymentPeriods, setPaymentPeriods] = useState<any[]>([])
  const [loadingPeriods, setLoadingPeriods] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    // جلب بيانات المستخدم أولاً، ثم العروض
    const loadData = async () => {
      await fetchUserProfile()
      fetchOffers(1)
    }
    
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchPaymentPeriods = async () => {
    try {
      setLoadingPeriods(true)
      const token = getToken()
      if (!token) return

      const res = await fetch('/api/profiles/payment-periods', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        setPaymentPeriods(data.results || data || [])
      }
    } catch (err) {
      console.error('Error fetching payment periods:', err)
    } finally {
      setLoadingPeriods(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const token = getToken()
      if (!token) return null

      const res = await fetch('/api/profiles/user-profile', {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      })

      if (res.ok) {
        const data = await res.json()
        setUserProfile(data)
        return data
      }
      return null
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  const fetchOffers = async (targetPage: number, search?: string) => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) {
        setError('❌ يجب تسجيل الدخول أولاً')
        return
      }

      let url = `/api/offers/max-offers?p=${targetPage}`
      if (search && search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`
      }

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const data = await res.json()
      
      // Ensure results is an array
      const results = Array.isArray(data.results) ? data.results : []
      
      setOffers(results)
      setTotalCount(data.count || 0)
      setPage(targetPage)
      setPageSize(data.page_size || 10)

    } catch (e) {
      console.error('Error fetching offers:', e)
      setError(e instanceof Error ? e.message : 'حدث خطأ غير معروف')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        fetchOffers(1, searchQuery)
      }
    }, 800) // debounce 800ms for better performance

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showDownloadMenu && !target.closest('.relative')) {
        setShowDownloadMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDownloadMenu])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(totalCount / pageSize)), [totalCount, pageSize])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="p-3 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">العروض</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <span className="text-sm font-medium text-blue-900 dark:text-blue-100">الإجمالي: </span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalCount}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث في اسم الصنف أو المخزن..."
              className="block w-full pr-12 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && !loading && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-amber-400 ml-3" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="mr-3">
                <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  استخدام البيانات التجريبية
                </h3>
                <div className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {error}
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                  API: <code className="bg-amber-100 dark:bg-amber-800 px-1 py-0.5 rounded">/api/offers/max-offers</code>
                </p>
              </div>
            </div>
          </div>
        )}

        {!loading && (
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">قائمة العروض</h2>
                <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] sm:text-xs font-medium rounded-full">
                  {offers.length} عرض
                </span>
              </div>
            </div>

            {/* Mobile cards */}
            <div className="grid sm:hidden gap-3 p-3">
              {Array.isArray(offers) && offers.map((item) => {
                const name = item.product?.name || '—'
                const price = String(item.product?.public_price ?? '0.00')
                const sellingDiscountPercentage = parseFloat(item.selling_discount_percentage ?? '0.00')
                const paymentPeriodAdditionPercentage = parseFloat(userProfile?.payment_period?.addition_percentage ?? '0.00')
                const discount = (sellingDiscountPercentage - paymentPeriodAdditionPercentage).toFixed(2)
                const quantity = Number(item.remaining_amount ?? 0)
                const storeName = item.user?.name || '—'

                return (
                  <div key={item.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{name}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{storeName}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold text-green-600 dark:text-green-400">{price} ج.م</div>
                        <div className="mt-1 inline-flex px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-[11px] font-bold text-green-800 dark:text-green-300">{discount}%</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="inline-flex items-center justify-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 rounded">
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200">الكمية: {quantity}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white min-w-[180px] sm:min-w-[220px]">اسم الصنف</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white w-24 sm:w-32">السعر</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white w-20 sm:w-28">الخصم %</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white w-20 sm:w-28">الكمية</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-center text-xs sm:text-sm font-semibold text-gray-900 dark:text-white min-w-[120px] sm:min-w-[160px]">المخزن</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {Array.isArray(offers) && offers.map((item) => {
                    const name = item.product?.name || '—'
                    const price = String(item.product?.public_price ?? '0.00')
                    const sellingDiscountPercentage = parseFloat(item.selling_discount_percentage ?? '0.00')
                    const paymentPeriodAdditionPercentage = parseFloat(userProfile?.payment_period?.addition_percentage ?? '0.00')
                    const discount = (sellingDiscountPercentage - paymentPeriodAdditionPercentage).toFixed(2)
                    const quantity = Number(item.remaining_amount ?? 0)
                    const storeName = item.user?.name || '—'

                    return (
                      <tr key={item.id} className="hover:bg-blue-50 dark:hover:bg-gray-700/50 transition-all duration-150">
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{name}</div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">{price} ج.م</div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                          <span className="inline-flex px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 shadow-sm">{discount}%</span>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 text-center">
                          <div className="inline-flex items-center justify-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <span className="text-sm font-bold text-blue-900 dark:text-blue-200">{quantity}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-3 sm:py-4 text-center">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">{storeName}</div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="px-3 sm:px-6 py-3 sm:py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  صفحة <span className="font-bold text-blue-600 dark:text-blue-400">{page}</span> من <span className="font-bold">{totalPages}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchOffers(Math.max(1, page - 1), searchQuery)}
                    disabled={page <= 1}
                    className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    السابق
                  </button>
                  <button
                    onClick={() => fetchOffers(Math.min(totalPages, page + 1), searchQuery)}
                    disabled={page >= totalPages}
                    className="inline-flex items-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    التالي
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
