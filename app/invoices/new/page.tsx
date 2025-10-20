"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getToken } from '../../lib/token-storage'
import NavBar from '../../components/NavBar'

interface Product {
  id: number
  name: string
  price: string
  discount: string
}

interface InvoiceItem {
  id: string
  product: Product
  quantity: number
  price: string
  discount: string
  total: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [products, setProducts] = useState<any[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([])
  const [currentProduct, setCurrentProduct] = useState<any | null>(null)
  const [currentQuantity, setCurrentQuantity] = useState('')
  const [searchProduct, setSearchProduct] = useState('')
  const [showProductDropdown, setShowProductDropdown] = useState(false)
  const [selectedProductIndex, setSelectedProductIndex] = useState(0)
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [savingInvoice, setSavingInvoice] = useState(false)
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'warning'} | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const productInputRef = useRef<HTMLInputElement>(null)
  const quantityInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.push('/login')
      return
    }
    
    // Load saved invoice items from localStorage
    const savedItems = localStorage.getItem('draft-invoice-items')
    if (savedItems) {
      try {
        const parsedItems = JSON.parse(savedItems)
        setInvoiceItems(parsedItems)
      } catch (error) {
        console.error('Error loading saved invoice items:', error)
      }
    }
    
    // Auto-fetch current user as customer and user profile
    const loadData = async () => {
      await fetchUserProfile()
      fetchCurrentUserAsCustomer(token)
    }
    
    loadData()
  }, [router])

  // Separate effect to save items when they change
  useEffect(() => {
    if (invoiceItems.length > 0) {
      localStorage.setItem('draft-invoice-items', JSON.stringify(invoiceItems))
    }
  }, [invoiceItems])

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (invoiceItems.length > 0) {
        localStorage.setItem('draft-invoice-items', JSON.stringify(invoiceItems))
      }
    }
  }, [])

  const fetchCurrentUserAsCustomer = async (token: string) => {
    try {
      const response = await fetch('/api/profiles/user-profile', {
        headers: {
          'Authorization': `Token ${token}`
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setSelectedCustomer(userData)
        // Focus on product input after customer is set
        setTimeout(() => productInputRef.current?.focus(), 100)
      }
    } catch (err) {
      console.error('Error fetching current user:', err)
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

  const fetchProducts = async (search: string) => {
    try {
      setLoadingProducts(true)
      const token = getToken()
      if (!token) return

      // Use max-offers endpoint for better product search with prices and discounts
      const url = `/api/offers/max-offers?search=${encodeURIComponent(search)}&page_size=20`
      const res = await fetch(url, {
        headers: { 'Authorization': `Token ${token}` }
      })

      if (res.ok) {
        const data = await res.json()
        // Transform max-offers data to product format
        const transformedProducts = (data.results || []).map((offer: any) => ({
          id: offer.product?.id || offer.id,
          offer_id: offer.id, // حفظ offer_id (مثال: 91) للاستخدام في الفاتورة
          name: offer.product?.name || 'منتج غير محدد',
          public_price: offer.product?.public_price || '0.00',
          selling_price: offer.product?.public_price || '0.00', // استخدام public_price
          discount: offer.selling_discount_percentage || '0.00',
          available_amount: offer.remaining_amount || offer.available_amount || 0,
          product_code: typeof offer.product_code === 'object' 
            ? offer.product_code?.code 
            : offer.product_code,
          user: offer.user
        }))
        setProducts(transformedProducts.slice(0, 20))
      }
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoadingProducts(false)
    }
  }


  useEffect(() => {
    if (searchProduct && searchProduct.length >= 1) {
      const timer = setTimeout(() => fetchProducts(searchProduct), 200)
      return () => clearTimeout(timer)
    }
  }, [searchProduct])


  const handleProductSelect = (product: any) => {
    setCurrentProduct(product)
    setSearchProduct(product.name)
    setShowProductDropdown(false)
    setCurrentQuantity('') // Reset quantity
    setTimeout(() => quantityInputRef.current?.focus(), 100)
  }

  const handleProductKeyDown = (e: React.KeyboardEvent) => {
    if (!showProductDropdown || products.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedProductIndex((prev) => Math.min(prev + 1, products.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedProductIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (products[selectedProductIndex]) {
        handleProductSelect(products[selectedProductIndex])
      }
    }
  }

  useEffect(() => {
    if (showProductDropdown) {
      setSelectedProductIndex(0)
    }
  }, [products, showProductDropdown])

  const handleQuantitySubmit = () => {
    if (!currentProduct || !currentQuantity || parseFloat(currentQuantity) <= 0) return

    const qty = parseFloat(currentQuantity)
    const price = parseFloat(currentProduct.public_price || '0')
    
    // حساب الخصم الجديد: selling_discount_percentage - payment_period.addition_percentage
    const sellingDiscountPercentage = parseFloat(currentProduct.discount || '0')
    const paymentPeriodAdditionPercentage = parseFloat(userProfile?.payment_period?.addition_percentage ?? '0.00')
    const calculatedDiscount = sellingDiscountPercentage - paymentPeriodAdditionPercentage
    const discount = calculatedDiscount.toFixed(2)
    
    const total = qty * price

    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      product: {
        id: currentProduct.id,
        name: currentProduct.name,
        price: currentProduct.public_price || '0.00',
        discount: discount
      },
      quantity: qty,
      price: currentProduct.public_price || '0.00',
      discount: discount,
      total,
      offer_id: currentProduct.offer_id // حفظ offer_id
    } as any

    const updatedItems = [...invoiceItems, newItem]
    setInvoiceItems(updatedItems)
    
    // Save to localStorage
    localStorage.setItem('draft-invoice-items', JSON.stringify(updatedItems))
    
    setCurrentProduct(null)
    setCurrentQuantity('')
    setSearchProduct('')
    setTimeout(() => productInputRef.current?.focus(), 100)
  }

  const handleConfirmInvoice = () => {
    if (!selectedCustomer || invoiceItems.length === 0) {
      alert('⚠️ يرجى إضافة منتجات للفاتورة')
      return
    }
    setShowConfirmModal(true)
  }

  const handleSaveInvoice = async () => {
    try {
      setSavingInvoice(true)
      const token = getToken()
      if (!token) {
        alert('❌ يجب تسجيل الدخول أولاً')
        router.push('/login')
        return
      }

      // Validate invoice data
      if (!selectedCustomer?.user?.id && !selectedCustomer?.id) {
        throw new Error('معرف العميل مفقود')
      }

      if (invoiceItems.length === 0) {
        throw new Error('لا توجد أصناف في الفاتورة')
      }

      // Validate all items have offer_id
      const invalidItems = invoiceItems.filter(item => !(item as any).offer_id)
      if (invalidItems.length > 0) {
        console.error('❌ Items missing offer_id:', invalidItems)
        throw new Error('بعض الأصناف لا تحتوي على معرف العرض')
      }

      // Prepare invoice data
      const invoiceData = {
        user: selectedCustomer.user?.id || selectedCustomer.id,
        items: invoiceItems.map(item => ({
          offer: (item as any).offer_id,
          quantity: item.quantity
        }))
      }

      console.log('📄 Creating invoice:', invoiceData)
      console.log('📄 Selected customer:', selectedCustomer)
      console.log('📄 Invoice items details:', invoiceItems.map(item => ({
        name: item.product.name,
        offer_id: (item as any).offer_id,
        quantity: item.quantity
      })))

      // Call the API
      const response = await fetch('/api/invoices/sale-invoices/create', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      })

      console.log('📄 API Response Status:', response.status)
      console.log('📄 API Response Headers:', response.headers.get('content-type'))

      let result
      const contentType = response.headers.get('content-type')
      
      if (contentType && contentType.includes('application/json')) {
        result = await response.json()
        console.log('📄 API Response Data:', result)
      } else {
        // If response is not JSON, get as text to see what we're getting
        const textResponse = await response.text()
        console.log('📄 API Response Text (not JSON):', textResponse.substring(0, 500))
        throw new Error(`Expected JSON response but got: ${contentType}. Response: ${textResponse.substring(0, 200)}`)
      }

      if (!response.ok) {
        console.error('❌ API error response:', result)
        
        // Extract detailed error message
        let errorMessage = result.error || `HTTP ${response.status}`
        
        // If there are field-specific errors, include them
        if (result.details) {
          const details = result.details
          if (typeof details === 'object' && !Array.isArray(details)) {
            const errorMessages = Object.entries(details)
              .map(([field, errors]) => {
                if (Array.isArray(errors)) {
                  return `${field}: ${errors.join(', ')}`
                }
                return `${field}: ${errors}`
              })
              .join('; ')
            
            if (errorMessages) {
              errorMessage = `${errorMessage} - ${errorMessages}`
            }
          } else if (typeof details === 'string') {
            errorMessage = `${errorMessage} - ${details}`
          }
        }
        
        throw new Error(errorMessage)
      }

      setShowConfirmModal(false)
      setToast({ message: '✅ تم حفظ الفاتورة بنجاح!', type: 'success' })
      console.log('📄 Invoice created:', result)
      
      // Clear saved draft items from localStorage
      localStorage.removeItem('draft-invoice-items')
      
      // Redirect after toast is shown
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
      
    } catch (err) {
      console.error('Error creating invoice:', err)
      setShowConfirmModal(false)
      
      let errorMessage = 'خطأ غير معروف'
      if (err instanceof Error) {
        errorMessage = err.message
        // If it's a JSON parse error, provide more helpful message
        if (err.message.includes('Unexpected token') || err.message.includes('JSON')) {
          errorMessage = 'خطأ في استجابة الخادم - تحقق من الاتصال'
        }
      }
      
      setToast({ 
        message: `❌ حدث خطأ في حفظ الفاتورة: ${errorMessage}`, 
        type: 'error' 
      })
    } finally {
      setSavingInvoice(false)
    }
  }

  const removeItem = (id: string) => {
    const updatedItems = invoiceItems.filter(item => item.id !== id)
    setInvoiceItems(updatedItems)
    
    // Save to localStorage
    localStorage.setItem('draft-invoice-items', JSON.stringify(updatedItems))
  }

  const clearDraftItems = () => {
    setShowClearConfirm(true)
  }

  const handleConfirmClear = () => {
    setInvoiceItems([])
    localStorage.removeItem('draft-invoice-items')
    setToast({ message: '✅ تم مسح البيانات المحفوظة', type: 'success' })
    setShowClearConfirm(false)
  }

  const handleCancelClear = () => {
    setShowClearConfirm(false)
  }

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.total, 0)
  const totalItems = invoiceItems.length
  const totalPublicPrice = invoiceItems.reduce((sum, item) => {
    const price = parseFloat(item.price)
    const qty = item.quantity
    return sum + (price * qty)
  }, 0)
  const averageDiscount = invoiceItems.length > 0 
    ? invoiceItems.reduce((sum, item) => sum + parseFloat(item.discount), 0) / invoiceItems.length 
    : 0

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <NavBar />
      <div className="p-3 sm:p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">إضافة فاتورة مبيعات جديدة</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">أدخل بيانات الفاتورة والمنتجات</p>
        </div>

        {/* Customer Info - Auto Selected */}
        {selectedCustomer && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">العميل المحدد</h3>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium text-green-600 dark:text-green-400">
                    ✅ {selectedCustomer.user?.name || selectedCustomer.name}
                  </span>
                  {selectedCustomer.user?.username && (
                    <span className="mr-2">• {selectedCustomer.user.username}</span>
                  )}
                  <span className="mr-2">• ID: {selectedCustomer.user?.id || selectedCustomer.id}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Items Table */}
        {invoiceItems.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">أصناف الفاتورة</h3>
                <span className="px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded-full">
                  {invoiceItems.length} صنف
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">#</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">اسم الصنف</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">السعر</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">الخصم</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">الكمية</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">الإجمالي</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoiceItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 font-bold text-sm">
                          {index + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white font-medium">
                        {item.product.name}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-900 dark:text-white">
                        {item.price} ج.م
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          {item.discount}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-blue-600 dark:text-blue-400">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-bold text-green-600 dark:text-green-400">
                        {item.total.toFixed(2)} ج.م
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">إضافة صنف جديد</h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Product Search */}
              <div className="lg:col-span-5 relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم الصنف (استخدم الأسهم و Enter)
                </label>
                <input
                  ref={productInputRef}
                  type="text"
                  value={searchProduct}
                  onChange={(e) => {
                    setSearchProduct(e.target.value)
                    if (e.target.value.length > 0) {
                      setShowProductDropdown(true)
                    }
                    if (!e.target.value) {
                      setCurrentProduct(null)
                    }
                  }}
                  onKeyDown={handleProductKeyDown}
                  onFocus={() => setShowProductDropdown(true)}
                  placeholder="ابحث عن المنتج..."
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                
                {showProductDropdown && (
                  <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {loadingProducts ? (
                      <div className="px-4 py-8 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">جاري البحث...</p>
                      </div>
                    ) : products.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                        لا توجد نتائج
                      </div>
                    ) : (
                      products.map((product, index) => (
                      <div
                        key={product.id}
                        onClick={() => handleProductSelect(product)}
                        className={`px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-colors ${
                          index === selectedProductIndex 
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-l-4 border-l-blue-600' 
                            : 'hover:bg-blue-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">
                                كود: {String(product.product_code || product.id)}
                              </span>
                              {product.user?.name && (
                                <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                                  {String(product.user.name)}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-left flex-shrink-0">
                            <div className="text-sm font-bold text-green-600 dark:text-green-400">
                              {String(product.public_price)} ج.م
                            </div>
                            {product.discount && parseFloat(product.discount) > 0 && (
                              <div className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                                خصم {(() => {
                                  const sellingDiscountPercentage = parseFloat(product.discount || '0')
                                  const paymentPeriodAdditionPercentage = parseFloat(userProfile?.payment_period?.addition_percentage ?? '0.00')
                                  const calculatedDiscount = sellingDiscountPercentage - paymentPeriodAdditionPercentage
                                  return calculatedDiscount.toFixed(2)
                                })()}%
                              </div>
                            )}
                            {product.available_amount && product.available_amount > 0 && (
                              <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                متاح: {String(product.available_amount)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                    )}
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  السعر
                </label>
                <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg text-center">
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">
                    {String(currentProduct?.public_price || '0.00')} ج.م
                  </span>
                </div>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الخصم %
                </label>
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-center">
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {currentProduct ? (
                      (() => {
                        const sellingDiscountPercentage = parseFloat(currentProduct.discount || '0')
                        const paymentPeriodAdditionPercentage = parseFloat(userProfile?.payment_period?.addition_percentage ?? '0.00')
                        const calculatedDiscount = sellingDiscountPercentage - paymentPeriodAdditionPercentage
                        return calculatedDiscount.toFixed(2)
                      })()
                    ) : '0'}%
                  </span>
                </div>
              </div>

              {/* Quantity Input */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الكمية (Enter)
                </label>
                <input
                  ref={quantityInputRef}
                  type="number"
                  min="1"
                  step="1"
                  value={currentQuantity}
                  onChange={(e) => setCurrentQuantity(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleQuantitySubmit()
                    }
                  }}
                  placeholder="0"
                  disabled={!currentProduct}
                  className="block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-center font-bold"
                />
              </div>

              {/* Add Button */}
              <div className="lg:col-span-1 flex items-end">
                <button
                  onClick={handleQuantitySubmit}
                  disabled={!currentProduct || !currentQuantity}
                  className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Stock Info */}
            {currentProduct && (
              <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">المنتج المحدد:</span>
                    <div className="text-gray-900 dark:text-white mt-1 truncate">{currentProduct.name}</div>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">الكمية المتاحة:</span>
                    <div className="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {String(currentProduct.available_amount || 'غير محدد')}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold text-blue-900 dark:text-blue-100">المخزن:</span>
                    <div className="text-gray-900 dark:text-white mt-1">
                      {String(currentProduct.user?.name || 'غير محدد')}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

        {/* Summary and Confirm */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg shadow-md border border-blue-200 dark:border-blue-700 p-6">
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              ملخص الفاتورة
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">عدد الأصناف:</span>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{totalItems}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">إجمالي سعر الجمهور:</span>
                <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                  {totalPublicPrice.toFixed(2)} ج.م
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-blue-200 dark:border-blue-700">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">متوسط الخصم:</span>
                <span className="inline-flex px-3 py-1 text-sm font-bold rounded-lg bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  {averageDiscount.toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-base font-semibold text-gray-900 dark:text-white">الإجمالي النهائي:</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalAmount.toFixed(2)} ج.م
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleConfirmInvoice}
              disabled={!selectedCustomer || invoiceItems.length === 0}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-md text-lg font-semibold"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              تأكيد الفاتورة
            </button>
            
            {invoiceItems.length > 0 && (
              <button
                onClick={clearDraftItems}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-md text-sm font-medium"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                مسح البيانات المحفوظة
              </button>
            )}
            
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              إلغاء
            </button>
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-3">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h2 className="text-2xl font-bold">تأكيد إنشاء فاتورة مبيعات</h2>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="hover:bg-white/20 rounded-lg p-2 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    معلومات العميل
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">الاسم:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedCustomer.user?.name || selectedCustomer.name}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">الموبايل:</span>
                      <div className="font-semibold text-gray-900 dark:text-white mt-1">
                        {selectedCustomer.user?.username || 'غير محدد'}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">كود العميل:</span>
                      <div className="font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        #{selectedCustomer.user?.id || selectedCustomer.id}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    الأصناف ({invoiceItems.length})
                  </h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {invoiceItems.map((item, index) => (
                      <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                              {item.product.name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {item.quantity} × {item.price} ج.م
                            </div>
                          </div>
                        </div>
                        <div className="text-left flex-shrink-0">
                          <div className="font-bold text-green-600 dark:text-green-400">
                            {item.total.toFixed(2)} ج.م
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">الإجمالي الكلي:</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {totalAmount.toFixed(2)} ج.م
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-6 rounded-b-2xl flex gap-3">
                <button
                  onClick={handleSaveInvoice}
                  disabled={savingInvoice}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold text-lg"
                >
                  {savingInvoice ? (
                    <>
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      تأكيد وحفظ الفاتورة
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  disabled={savingInvoice}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors font-semibold disabled:opacity-50"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Clear Draft Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-rose-600 p-6">
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="text-xl font-bold">تأكيد مسح البيانات المحفوظة</h3>
                </div>
                <button onClick={handleCancelClear} className="hover:bg-white/20 rounded-lg p-2 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-200 text-lg">
                هل أنت متأكد من مسح جميع الأصناف المضافة للفاتورة؟ سيتم حذف جميع المنتجات المحفوظة ولن تتمكن من التراجع عن هذا الإجراء.
              </p>
              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  onClick={handleCancelClear}
                  className="px-5 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleConfirmClear}
                  className="px-5 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-semibold"
                >
                  نعم، مسح جميع الأصناف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
            toast.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            toast.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
            'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
