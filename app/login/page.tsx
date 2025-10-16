"use client"

import React, { FormEvent, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { userLogin } from '../lib/auth'
import { setToken } from '../lib/token-storage'
import { ROUTES } from '../lib/constants'
import type { LoginCredentials, ApiError } from '../lib/types'

interface FormErrors {
  username?: string
  password?: string
  general?: string
}

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<LoginCredentials>({
    username: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = useCallback((field: keyof LoginCredentials) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value
      setFormData(prev => ({ ...prev, [field]: value }))
      
      if (errors[field]) {
        setErrors(prev => ({ ...prev, [field]: undefined }))
      }
    }, [errors])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})
    
    try {
      const response = await userLogin(formData)
      
      if (response?.token) {
        setToken(response.token)
        router.replace(ROUTES.DASHBOARD)
      } else {
        setErrors({ general: 'استجابة غير صالحة من الخادم' })
      }
    } catch (error) {
      const apiError = error as ApiError
      setErrors({ 
        general: apiError?.message || 'فشل تسجيل الدخول. حاول مرة أخرى.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h1 className="text-2xl font-semibold mb-6 text-center text-gray-900 dark:text-white">
            تسجيل الدخول - نظام الصيدلية
          </h1>
          
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <input 
                className={`w-full border rounded px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="اسم المستخدم" 
                value={formData.username} 
                onChange={handleInputChange('username')}
                disabled={loading}
                required
                aria-invalid={!!errors.username}
                aria-describedby={errors.username ? 'username-error' : undefined}
              />
              {errors.username && (
                <p id="username-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.username}
                </p>
              )}
            </div>
            
            <div>
              <input 
                className={`w-full border rounded px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="كلمة المرور" 
                type="password" 
                value={formData.password} 
                onChange={handleInputChange('password')}
                disabled={loading}
                required
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? 'password-error' : undefined}
              />
              {errors.password && (
                <p id="password-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            
            {errors.general && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3">
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {errors.general}
                </p>
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading} 
              className="w-full bg-black hover:bg-gray-800 disabled:bg-gray-400 text-white rounded py-2 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label={loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            >
              {loading ? 'جاري التحميل…' : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

