"use client"

import React, { FormEvent, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { pharmacyRegistration } from '../lib/auth'
import { ROUTES } from '../lib/constants'
import type { PharmacyRegistrationData, ApiError } from '../lib/types'
import NavBar from '../components/NavBar'

interface FormErrors {
  username?: string
  name?: string
  e_name?: string
  password?: string
  confirm_password?: string
  general?: string
}

export default function PharmacyRegistrationPage() {
  const router = useRouter()
  const [formData, setFormData] = useState<PharmacyRegistrationData>({
    username: '',
    name: '',
    e_name: '',
    password: '',
    confirm_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    
    if (!formData.username.trim()) {
      newErrors.username = 'اسم المستخدم مطلوب'
    } else if (!/^\+?[0-9]+$/.test(formData.username)) {
      newErrors.username = 'اسم المستخدم يجب أن يكون رقم هاتف صحيح'
    }
    
    if (!formData.name.trim()) {
      newErrors.name = 'اسم الصيدلية بالعربية مطلوب'
    }
    
    if (!formData.e_name.trim()) {
      newErrors.e_name = 'اسم الصيدلية بالإنجليزية مطلوب'
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'كلمة المرور مطلوبة'
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
    }
    
    if (!formData.confirm_password.trim()) {
      newErrors.confirm_password = 'تأكيد كلمة المرور مطلوب'
    } else if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'كلمة المرور غير متطابقة'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = useCallback((field: keyof PharmacyRegistrationData) => 
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
      const response = await pharmacyRegistration(formData)
      
      if (response?.success) {
        // Registration successful, redirect to login
        router.replace(ROUTES.LOGIN)
      } else {
        setErrors({ general: response?.message || 'فشل تسجيل الصيدلية' })
      }
    } catch (error) {
      const apiError = error as ApiError
      setErrors({ 
        general: apiError?.message || 'فشل تسجيل الصيدلية. حاول مرة أخرى.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="flex items-center justify-center p-3 sm:p-6 pt-8">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-center text-gray-900 dark:text-white">
            تسجيل صيدلية جديدة
          </h1>
          
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div>
              <input 
                className={`w-full border rounded px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.username 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="رقم الهاتف (+201020304050)" 
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
                  errors.name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="اسم الصيدلية (عربي)" 
                value={formData.name} 
                onChange={handleInputChange('name')}
                disabled={loading}
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
            
            <div>
              <input 
                className={`w-full border rounded px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.e_name 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="اسم الصيدلية (إنجليزي)" 
                value={formData.e_name} 
                onChange={handleInputChange('e_name')}
                disabled={loading}
                required
                aria-invalid={!!errors.e_name}
                aria-describedby={errors.e_name ? 'e_name-error' : undefined}
              />
              {errors.e_name && (
                <p id="e_name-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.e_name}
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
            
            <div>
              <input 
                className={`w-full border rounded px-3 py-2 text-gray-900 dark:text-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirm_password 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="تأكيد كلمة المرور" 
                type="password" 
                value={formData.confirm_password} 
                onChange={handleInputChange('confirm_password')}
                disabled={loading}
                required
                aria-invalid={!!errors.confirm_password}
                aria-describedby={errors.confirm_password ? 'confirm_password-error' : undefined}
              />
              {errors.confirm_password && (
                <p id="confirm_password-error" className="text-sm text-red-600 mt-1" role="alert">
                  {errors.confirm_password}
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
              aria-label={loading ? 'جاري تسجيل الصيدلية...' : 'تسجيل الصيدلية'}
            >
              {loading ? 'جاري التحميل…' : 'تسجيل الصيدلية'}
            </button>
            
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                لديك حساب بالفعل؟{' '}
                <button
                  type="button"
                  onClick={() => router.push(ROUTES.LOGIN)}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  تسجيل الدخول
                </button>
              </p>
            </div>
          </form>
          </div>
        </div>
      </div>
    </div>
  )
}
