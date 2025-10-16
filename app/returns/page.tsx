"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../lib/token-storage'
import NavBar from '../components/NavBar'

interface SaleReturn {
  id: number
  user: {
    id: number
    username: string
    name: string
    role: string
    role_label: string
  }
  items_count: number
  total_quantity: number
  total_price: string
  status: string
  status_label: string
  created_at: string
}

export default function ReturnsPage() {
  const router = useRouter()
  const [returns, setReturns] = useState<SaleReturn[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    fetchReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchReturns = async () => {
    try {
      setLoading(true)
      const token = getToken()
      if (!token) return

      const response = await fetch('/api/invoices/sale-return-invoices', {
        headers: {
          'Authorization': `Token ${token}`,
        }
      })

      if (!response.ok) {
        throw new Error('فشل تحميل المرتجعات')
      }

      const data = await response.json()
      setReturns(data.results || [])
    } catch (err) {
      console.error('Error fetching returns:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalReturns = returns.length
    const placedReturns = returns.filter(r => r.status === 'placed' || r.status === 'pending').length
    const totalAmount = returns.reduce((sum, r) => sum + parseFloat(r.total_price || '0'), 0)
    
    return {
      total_returns: totalReturns,
      pending_returns: placedReturns,
      total_amount: totalAmount.toFixed(2),
    }
  }

  const stats = calculateStats()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'placed':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200'
      case 'approved':
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 border-green-200'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toLocaleString('ar-EG', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })
  }

  const filteredReturns = statusFilter === 'all' 
    ? returns 
    : returns.filter(r => r.status === statusFilter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">جاري تحميل المرتجعات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg className="h-8 w-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  مرتجعات المبيعات
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">إدارة ومتابعة مرتجعات الفواتير</p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded">الإجمالي</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.total_returns}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي المرتجعات</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 bg-yellow-50 dark:bg-yellow-900/10 px-2 py-1 rounded">قيد المراجعة</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{stats.pending_returns}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">مرتجعات معلقة</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <span className="text-xs text-gray-500 bg-purple-50 dark:bg-purple-900/10 px-2 py-1 rounded">المبلغ</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{formatCurrency(stats.total_amount)} ج.م</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي قيمة المرتجعات</p>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">تصفية حسب الحالة:</span>
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                الكل ({stats.total_returns})
              </button>
              <button
                onClick={() => setStatusFilter('placed')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'placed'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-100 dark:hover:bg-yellow-900/30'
                }`}
              >
                قيد المراجعة ({stats.pending_returns})
              </button>
            </div>
          </div>

          {/* Returns Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      العميل
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      عدد الأصناف
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      إجمالي الكمية
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      المبلغ
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      الحالة
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      التاريخ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          <div className="animate-spin h-12 w-12 border-4 border-orange-200 border-t-orange-600 rounded-full mb-3"></div>
                          <p className="text-lg font-medium">جاري التحميل...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredReturns.length > 0 ? (
                    filteredReturns.map((returnItem) => (
                      <tr 
                        key={returnItem.id} 
                        onClick={() => router.push(`/returns/${returnItem.id}`)}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <div className="w-2 h-2 bg-orange-500 rounded-full ml-2"></div>
                            <span className="text-sm font-bold text-orange-600">
                              #{returnItem.id}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {returnItem.user?.name || 'غير محدد'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {returnItem.user?.username || ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                            {returnItem.items_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200">
                            {returnItem.total_quantity}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {formatCurrency(returnItem.total_price)} ج.م
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                              returnItem.status
                            )}`}
                          >
                            {returnItem.status_label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(returnItem.created_at)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                          <svg className="h-12 w-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          <p className="text-lg font-medium">لا توجد مرتجعات</p>
                          <p className="text-sm mt-1">قم بإضافة مرتجع جديد للبدء</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">ملاحظة هامة</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  جميع المرتجعات تخضع للمراجعة والموافقة قبل إتمام عملية الاسترجاع. يُرجى التأكد من
                  صحة البيانات وسبب الإرجاع قبل الإرسال.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

