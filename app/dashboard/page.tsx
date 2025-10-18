"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getUser } from '../lib/token-storage'
import NavBar from '../components/NavBar'

interface UserProfile {
  id: number
  user: {
    id: number
    name: string
    e_name: string
    username: string
    role: string
    role_label: string
    account?: {
      id: number
      balance: string
      credit_limit: string
      remaining_credit: string
      transactions_url: string
    }
  }
  city: {
    id: number
    name: string
    country: {
      id: number
      name: string
    }
  } | null
  category: string
  category_label: string
  license: string | null
  address: string
  remarks: string
  latest_invoice_date: string | null
  payment_period: {
    id: number
    name: string
    period_in_days: number
    addition_percentage: string
    reminder_days_before: number
  } | null
  profit_percentage: string
  order_by_phone: boolean
  company: boolean
  key_person: string
  key_person_phone: string
  area_manager?: string
}

interface AccountSummary {
  user: {
    id: number
    name: string
    username: string
    role: string
  }
  account: {
    id: number
    balance: number
    credit_limit: number
    remaining_credit: number
  }
  period_summary: {
    days: number
    from_date: string
    to_date: string
    total_payments_made: number
    payments_count: number
    total_payments_received: number
    receipts_count: number
  }
  recent_transactions: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [username, setUsername] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null)
  const [loadingFinancial, setLoadingFinancial] = useState(false)
  const [isOffline, setIsOffline] = useState(false)

  // Demo data for offline mode
  const demoUserProfile: UserProfile = {
    id: 2,
    user: {
      id: 5,
      name: "الشفاء",
      e_name: "",
      username: "+201090552414",
      role: "PHARMACY",
      role_label: "Pharmacy",
      account: {
        id: 1,
        balance: "-3974.45",
        credit_limit: "100000.00",
        remaining_credit: "96025.55",
        transactions_url: "http://129.212.140.152/finance/account-transactions/?account=1"
      }
    },
    city: {
      id: 1,
      name: "شبين الكوم",
      country: {
        id: 1,
        name: "شبين الكوم"
      }
    },
    category: "none",
    category_label: "Unassigned",
    license: null,
    address: "",
    remarks: "",
    latest_invoice_date: "2025-10-13T20:43:48.011083Z",
    payment_period: {
      id: 2,
      name: "orange",
      period_in_days: 30,
      addition_percentage: "3.00",
      reminder_days_before: 3
    },
    profit_percentage: "1.50",
    order_by_phone: false,
    company: false,
    key_person: "",
    key_person_phone: ""
  }

  useEffect(() => {
    const token = getToken()
    const user = getUser()
    
    if (!token) {
      router.replace('/login')
      return
    }

    setUsername(user)
    
    // Validate token before making request
    if (!token || token.trim() === '') {
      console.error('Invalid or empty token')
      alert('خطأ في التوكن. يرجى تسجيل الدخول مرة أخرى.')
      router.replace('/login')
      return
    }
    
    fetchUserProfile(token)
  }, [router])

  const fetchUserProfile = async (token: string, retryCount = 0) => {
    const maxRetries = 2
    
    // Validate token
    if (!token || token.trim() === '') {
      console.error('Invalid or empty token in fetchUserProfile')
      alert('خطأ في التوكن. يرجى تسجيل الدخول مرة أخرى.')
      router.replace('/login')
      return
    }
    
    try {
      setLoading(true)
      
      const response = await fetch('/api/profiles/user-profile', {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (response.ok) {
        try {
          const data = await response.json()
          console.log('Frontend received data:', data)
          console.log('Data keys:', Object.keys(data))
          console.log('Data type:', typeof data)
          
          // Check if data is empty or invalid
          if (!data || Object.keys(data).length === 0) {
            console.error('Empty or invalid response data:', data)
            alert('تم استلام استجابة فارغة من الخادم. يرجى المحاولة مرة أخرى.')
            return
          }
          
          setUserProfile(data)
          
          // Fetch account summary
          fetchAccountSummary(token)
        } catch (jsonError) {
          console.error('JSON parsing error:', jsonError)
          const responseText = await response.text()
          console.error('Raw response text:', responseText)
          alert('خطأ في تحليل استجابة الخادم. يرجى المحاولة مرة أخرى.')
        }
      } else {
        const errorData = await response.text()
        console.error('Failed to fetch user profile:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          retryCount
        })
        
        // Handle specific error cases
        if (response.status === 503) {
          // Server unavailable - use offline mode
          setIsOffline(true)
          setUserProfile(demoUserProfile)
          alert('الخادم غير متاح حالياً. يتم عرض البيانات التجريبية.')
        } else if (response.status === 504) {
          // Timeout - retry once
          if (retryCount < maxRetries) {
            console.log(`Retrying fetchUserProfile (attempt ${retryCount + 1}/${maxRetries})`)
            setTimeout(() => fetchUserProfile(token, retryCount + 1), 1000 * (retryCount + 1))
            return
          } else {
            setIsOffline(true)
            setUserProfile(demoUserProfile)
            alert('انتهت مهلة الاتصال بالخادم. يتم عرض البيانات التجريبية.')
          }
        } else if (response.status >= 500) {
          // Other server errors - retry once
          if (retryCount < maxRetries) {
            console.log(`Retrying fetchUserProfile (attempt ${retryCount + 1}/${maxRetries})`)
            setTimeout(() => fetchUserProfile(token, retryCount + 1), 1000 * (retryCount + 1))
            return
          } else {
            setIsOffline(true)
            setUserProfile(demoUserProfile)
            alert('خطأ في الخادم. يتم عرض البيانات التجريبية.')
          }
        } else if (response.status === 401) {
          // Unauthorized - token issue
          alert('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى.')
          router.replace('/login')
        } else if (response.status === 403) {
          // Forbidden
          alert('ليس لديك صلاحية للوصول إلى هذه البيانات.')
        } else if (response.status === 422) {
          // Invalid response structure
          setIsOffline(true)
          setUserProfile(demoUserProfile)
          alert('خطأ في هيكل البيانات. يتم عرض البيانات التجريبية.')
        } else {
          // Other client errors (4xx) - don't retry
          alert(`خطأ في تحميل بيانات المستخدم: ${response.status} - ${response.statusText}`)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
      
      // Handle network errors
      if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
        setIsOffline(true)
        setUserProfile(demoUserProfile)
        alert('الخادم غير متاح. يتم عرض البيانات التجريبية.')
      } else if (error instanceof Error && error.message.includes('ENOTFOUND')) {
        setIsOffline(true)
        setUserProfile(demoUserProfile)
        alert('لا يمكن الوصول للخادم. يتم عرض البيانات التجريبية.')
      } else if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network fetch error - retry once
        if (retryCount < maxRetries) {
          console.log(`Retrying fetchUserProfile due to network error (attempt ${retryCount + 1}/${maxRetries})`)
          setTimeout(() => fetchUserProfile(token, retryCount + 1), 1000 * (retryCount + 1))
          return
        } else {
          setIsOffline(true)
          setUserProfile(demoUserProfile)
          alert('خطأ في الاتصال بالخادم. يتم عرض البيانات التجريبية.')
        }
      } else {
        // Unknown error
        setIsOffline(true)
        setUserProfile(demoUserProfile)
        alert(`خطأ غير متوقع. يتم عرض البيانات التجريبية: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchAccountSummary = async (token: string) => {
    try {
      setLoadingFinancial(true)
      
      const response = await fetch('/api/finance/user-financial-summary', {
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAccountSummary(data)
      }
    } catch (error) {
      console.error('Error fetching account summary:', error)
    } finally {
      setLoadingFinancial(false)
    }
  }

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num) + ' ج.م'
  }

  const formatPhone = (phone: string) => {
    if (!phone || phone === 'غير محدد') return phone
    if (phone.startsWith('+20')) {
      const num = phone.slice(3)
      return `${num.slice(0, 3)} ${num.slice(3, 6)} ${num.slice(6)}`
    }
    return phone
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="flex flex-col justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-center text-gray-600 dark:text-gray-400 mt-6 text-lg font-medium">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <NavBar />
        <div className="p-6">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">خطأ في تحميل البيانات</h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <p>لا يمكن تحميل بيانات الصيدلية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const balance = parseFloat(userProfile.user.account?.balance || '0')
  const creditLimit = parseFloat(userProfile.user.account?.credit_limit || '0')
  const remainingCredit = parseFloat(userProfile.user.account?.remaining_credit || '0')

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      
      <div className="p-3 sm:p-4 lg:p-6 max-w-7xl mx-auto">
        {/* Offline Mode Indicator */}
        {isOffline && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-orange-800 dark:text-orange-200">وضع عدم الاتصال</h3>
                <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                  <p>الخادم غير متاح حالياً. يتم عرض البيانات التجريبية.</p>
                  <button
                    onClick={() => {
                      setIsOffline(false)
                      fetchUserProfile(getToken() || '')
                    }}
                    className="mt-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white text-xs rounded transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pharmacy Information Card */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <span className="text-lg sm:text-xl font-bold text-white">
                  {userProfile.user.id.toString().slice(-2)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {userProfile.user.name}
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span>ID: <span className="font-medium">{userProfile.user.id}</span></span>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 w-fit">
                    {userProfile.category_label}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-left lg:text-right">
              <div className={`text-2xl sm:text-3xl font-bold ${
                balance < 0 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-green-600 dark:text-green-400'
              }`}>
                {balance < 0 ? '-' : '+'}{formatCurrency(Math.abs(balance))}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {balance < 0 ? 'الدين الحالي' : 'الرصيد الحالي'}
              </div>
            </div>
          </div>

          {/* Pharmacy Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
              <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">رقم الموبايل</label>
              <div className="mt-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {formatPhone(userProfile.user.username)}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
              <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">المدينة</label>
              <div className="mt-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {userProfile.city?.name || 'غير محدد'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
              <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">الشخص الرئيسي</label>
              <div className="mt-1 text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                {userProfile.key_person || 'غير محدد'}
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 sm:p-4 rounded-lg">
              <label className="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">نسبة الربح</label>
              <div className="mt-1 text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400">
                {userProfile.profit_percentage ? `${userProfile.profit_percentage}%` : 'غير محدد'}
              </div>
            </div>
          </div>
        </div>


        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-4 sm:mb-6">الإجراءات السريعة</h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <button
              onClick={() => router.push('/invoices')}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-center">الفواتير</span>
            </button>

            <button
              onClick={() => router.push('/returns')}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-center">المرتجعات</span>
            </button>

            <button
              onClick={() => router.push('/offers')}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-center">العروض</span>
            </button>

            <button
              onClick={() => router.push('/invoices/new')}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-center">إضافة فاتورة</span>
            </button>

            <button
              onClick={() => router.push('/account-statement')}
              className="flex flex-col items-center justify-center gap-2 sm:gap-3 p-3 sm:p-4 bg-gradient-to-br from-sky-500 to-cyan-600 hover:from-sky-600 hover:to-cyan-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-7 4h8M7 5h10a2 2 0 012 2v10a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2z" />
              </svg>
              <span className="text-xs sm:text-sm font-medium text-center">كشف حساب</span>
            </button>
          </div>
        </div>


        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">الحد الائتماني</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(creditLimit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">الائتمان المتاح</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(remainingCredit)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">آخر فاتورة</p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {userProfile.latest_invoice_date 
                    ? new Date(userProfile.latest_invoice_date).toLocaleDateString('ar-EG', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : 'لا يوجد'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">فترة الدفع</p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {userProfile.payment_period 
                    ? `${userProfile.payment_period.name} (${userProfile.payment_period.period_in_days} يوم)`
                    : 'غير محدد'}
                </p>
                {userProfile.payment_period && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    نسبة إضافية: {userProfile.payment_period.addition_percentage}%
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Financial Data Section */}
        <div className="mb-4 sm:mb-6 flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">البيانات المالية</h3>
          {loadingFinancial && (
            <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>جاري التحميل...</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">المدفوعات المسددة</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {accountSummary ? formatCurrency(accountSummary.period_summary.total_payments_made) : '0 ج.م'}
                </p>
                {accountSummary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {accountSummary.period_summary.payments_count} دفعة
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">المدفوعات المستلمة</p>
                <p className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">
                  {accountSummary ? formatCurrency(accountSummary.period_summary.total_payments_received) : '0 ج.م'}
                </p>
                {accountSummary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {accountSummary.period_summary.receipts_count} إيصال
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">مدة الأجل</p>
                <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {accountSummary ? `${accountSummary.period_summary.days} يوم` : 'غير محدد'}
                </p>
                {accountSummary && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {new Date(accountSummary.period_summary.from_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })} - {new Date(accountSummary.period_summary.to_date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="p-2 sm:p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">المعاملات الأخيرة</p>
                <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  {accountSummary ? accountSummary.recent_transactions.length : 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  معاملة حديثة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
