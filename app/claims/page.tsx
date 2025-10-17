"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../lib/token-storage'
import NavBar from '../components/NavBar'

interface CollectionSchedule {
  user_id: number
  customer_name: string
  username: string
  payment_period_name: string
  period_in_days: number
  latest_invoice_date: string
  expected_collection_date: string
  days_until_collection: number
  outstanding_balance: string
  is_overdue: boolean
  penalty_percentage: string
  penalty_amount: string
  total_with_penalty: string
  cashback_percentage: string
  cashback_amount: string
  total_with_cashback: string
}

export default function ClaimsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [collectionData, setCollectionData] = useState<CollectionSchedule | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    fetchCollectionSchedule()
  }, [router])

  const fetchCollectionSchedule = async () => {
    try {
      const token = getToken()
      if (!token) return

      const response = await fetch('/api/finance/my-collection-schedule', {
        headers: { 'Authorization': `Token ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCollectionData(data)
      } else {
        setError('فشل في جلب جدول التحصيل')
      }
    } catch (err) {
      setError('حدث خطأ أثناء جلب جدول التحصيل')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 2
    }).format(parseFloat(amount))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <div className="text-red-600 dark:text-red-400 mb-2">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">خطأ في تحميل البيانات</h3>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              <button
                onClick={fetchCollectionSchedule}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                إعادة المحاولة
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!collectionData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-gray-600 dark:text-gray-400">لا توجد بيانات متاحة</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">

          {/* Collection Schedule Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                جدول التحصيل
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                تفاصيل مواعيد ومبالغ التحصيل
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      معاد التحصيل
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      المبلغ المستحق
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      عدد الأيام المتبقية
                    </th>
                    <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      الحالة
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="mr-3">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(collectionData.expected_collection_date)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {collectionData.payment_period_name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(collectionData.outstanding_balance)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        الرصيد الأساسي
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        collectionData.days_until_collection <= 7 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                          : collectionData.days_until_collection <= 14
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {collectionData.days_until_collection} يوم
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        collectionData.is_overdue 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' 
                          : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          collectionData.is_overdue ? 'bg-red-400' : 'bg-green-400'
                        }`}></div>
                        {collectionData.is_overdue ? 'متأخر' : 'في الموعد'}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}