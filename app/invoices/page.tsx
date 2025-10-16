"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../lib/token-storage'
import NavBar from '../components/NavBar'

interface SalesInvoice {
  id: number
  invoice_number?: string
  user?: { name: string; username: string }
  seller?: { name: string }
  items_count?: number
  total_quantity?: number
  total_price?: string | number
  status?: string
  status_label?: string
  created_at?: string
}

export default function InvoicesPage() {
  const router = useRouter()
  const [invoices, setInvoices] = useState<SalesInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    fetchInvoices(1)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const fetchInvoices = async (targetPage: number) => {
    try {
      setLoading(true)
      setError(null)

      const token = getToken()
      if (!token) return

      const res = await fetch(`/api/invoices/sale-invoices?p=${targetPage}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Accept': 'application/json'
        }
      })

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`)
      }

      const data = await res.json()
      setInvoices(data.results || [])
      setTotalCount(data.count || 0)
      setPage(targetPage)

    } catch (err) {
      console.error('Error fetching invoices:', err)
      setError('فشل في تحميل الفواتير')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    const totalSales = invoices.reduce((sum, inv) => {
      const amount = typeof inv.total_price === 'number' ? inv.total_price : 
                     typeof inv.total_price === 'string' ? parseFloat(inv.total_price) : 0
      return sum + (amount || 0)
    }, 0)
    const totalInvoices = invoices.length
    const averageInvoice = totalInvoices > 0 ? totalSales / totalInvoices : 0
    const paidInvoices = invoices.filter(inv => inv.status === 'PAID' || inv.status === 'paid').length
    
    return {
      totalSales,
      totalInvoices,
      averageInvoice,
      paidInvoices
    }
  }

  const stats = calculateStats()

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">غير محدد</span>
    const statusConfig = {
      pending: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
      PENDING: { label: 'في الانتظار', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300' },
      paid: { label: 'مدفوع', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      PAID: { label: 'مدفوع', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' },
      rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
      REJECTED: { label: 'مرفوض', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300' },
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || status}
      </span>
    )
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return num.toLocaleString('ar-EG') + ' ج.م'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'غير محدد'
    const date = new Date(dateString)
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const totalPages = Math.ceil(totalCount / 10)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-3 sm:p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF6B35]"></div>
          </div>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-4">جاري تحميل الفواتير...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <p className="text-amber-700 dark:text-amber-300">{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFE8E0] dark:bg-[#3A2417] rounded-xl">
              <svg className="h-6 w-6 text-[#FF6B35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">فواتير المبيعات</h1>
              <p className="text-gray-600 dark:text-gray-400">إدارة ومتابعة فواتير المبيعات</p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 border-r-4 border-r-green-500">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">إجمالي المبيعات</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{formatCurrency(stats.totalSales)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">إجمالي قيمة المبيعات</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 border-r-4 border-r-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">عدد الفواتير</h3>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.totalInvoices}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">إجمالي فواتير المبيعات</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 border-r-4 border-r-orange-500">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">متوسط الفاتورة</h3>
            </div>
            <p className="text-3xl font-bold text-orange-600">{formatCurrency(stats.averageInvoice)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">متوسط قيمة الفاتورة</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 border-r-4 border-r-green-500">
            <div className="flex items-center gap-3 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400">فواتير مدفوعة</h3>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.paidInvoices}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">فواتير مكتملة الدفع</p>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    رقم الفاتورة
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الصيدلية
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    عدد الأصناف
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    القيمة
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    التاريخ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    الحالة
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr 
                      key={invoice.id} 
                      onClick={() => router.push(`/invoices/${invoice.id}`)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <svg className="h-4 w-4 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <span className="text-sm font-bold text-blue-600">
                            #{invoice.id}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.user?.name || 'غير محدد'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {invoice.user?.username || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-bold">
                          {invoice.items_count || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm font-bold text-green-600 dark:text-green-400">
                          {formatCurrency(invoice.total_price || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(invoice.status)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                        <svg className="h-12 w-12 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">لا توجد فواتير</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  صفحة {page} من {totalPages} • الإجمالي: {totalCount}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => fetchInvoices(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="px-4 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => fetchInvoices(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    التالي
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

