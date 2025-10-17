"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import NavBar from '../components/NavBar'
import { getToken, removeToken } from '../lib/token-storage'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function SkySalesPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isRequestingMic, setIsRequestingMic] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [callInterval, setCallInterval] = useState<NodeJS.Timeout | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken()
      if (!token) {
        router.push('/login')
        return
      }
      setLoading(false)
    }
    checkAuth()
  }, [router])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [inputMessage])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsSending(true)

    try {
      const token = getToken()
      const response = await fetch('/api/skyrep/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          messages: [...messages, userMessage]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في إرسال الرسالة. الرجاء المحاولة مرة أخرى.'
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop()
      }
      setIsRecording(false)
      return
    }

    try {
      setIsRequestingMic(true)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('الميكروفون غير مدعوم في هذا المتصفح')
      }

      // Request microphone permission with better error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      const recorder = new MediaRecorder(stream)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setAudioChunks(prev => [...prev, event.data])
        }
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
        setAudioChunks([])
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Send audio to server
        await sendAudioToServer(audioBlob)
      }

      recorder.onerror = (event) => {
        console.error('Recording error:', event)
        setIsRecording(false)
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'حدث خطأ في التسجيل. الرجاء المحاولة مرة أخرى.'
        }
        setMessages(prev => [...prev, errorMessage])
      }

      setMediaRecorder(recorder)
      setAudioChunks([])
      recorder.start()
      setIsRecording(true)
      setIsRequestingMic(false)
    } catch (error: any) {
      console.error('Error accessing microphone:', error)
      setIsRecording(false)
      setIsRequestingMic(false)
      
      let errorMessage = 'عذراً، لا يمكن الوصول إلى الميكروفون.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض إذن الميكروفون. الرجاء السماح بالوصول إلى الميكروفون في إعدادات المتصفح.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'لم يتم العثور على ميكروفون. الرجاء التأكد من وجود ميكروفون متصل.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'الميكروفون غير مدعوم في هذا المتصفح.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'الميكروفون قيد الاستخدام من قبل تطبيق آخر.'
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage
      }
      setMessages(prev => [...prev, errorMsg])
    }
  }

  const sendAudioToServer = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      
      const token = getToken()
      const response = await fetch('/api/skyrep/voice', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to process audio')
      }

      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error processing audio:', error)
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في معالجة الصوت. الرجاء المحاولة مرة أخرى.'
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleVoiceCall = async () => {
    if (isInCall) {
      // End call
      if (callInterval) {
        clearInterval(callInterval)
        setCallInterval(null)
      }
      setIsInCall(false)
      return
    }

    try {
      setIsRequestingMic(true)
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('الميكروفون غير مدعوم في هذا المتصفح')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })
      
      // Start continuous recording and sending
      const startCall = () => {
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []
        
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        recorder.onstop = async () => {
          if (chunks.length > 0) {
            const audioBlob = new Blob(chunks, { type: 'audio/wav' })
            await sendAudioToServer(audioBlob)
          }
        }

        recorder.onerror = (event) => {
          console.error('Call recording error:', event)
          setIsInCall(false)
          if (callInterval) {
            clearInterval(callInterval)
            setCallInterval(null)
          }
        }

        recorder.start()
        
        // Stop and send every 2 seconds
        setTimeout(() => {
          if (recorder.state === 'recording') {
            recorder.stop()
          }
        }, 2000)
      }

      // Start the call process
      const interval = setInterval(async () => {
        try {
          startCall()
        } catch (error) {
          console.error('Error processing call chunk:', error)
        }
      }, 2000) // Send chunks every 2 seconds

      setCallInterval(interval)
      setIsInCall(true)
      setIsRequestingMic(false)
    } catch (error: any) {
      console.error('Error starting call:', error)
      setIsInCall(false)
      setIsRequestingMic(false)
      
      let errorMessage = 'عذراً، لا يمكن بدء المكالمة.'
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'تم رفض إذن الميكروفون. الرجاء السماح بالوصول إلى الميكروفون في إعدادات المتصفح.'
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'لم يتم العثور على ميكروفون. الرجاء التأكد من وجود ميكروفون متصل.'
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'الميكروفون غير مدعوم في هذا المتصفح.'
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'الميكروفون قيد الاستخدام من قبل تطبيق آخر.'
      }
      
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: errorMessage
      }
      setMessages(prev => [...prev, errorMsg])
    }
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <NavBar />
      
      {/* Main Chat Container - ChatGPT Style */}
      <div className="flex-1 flex flex-col w-full">
        {messages.length === 0 ? (
          /* Welcome Screen - ChatGPT Style */
          <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
            <div className="text-center mb-8 max-w-2xl">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                مرحباً بك في SkySales
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                كيف يمكنني مساعدتك اليوم؟
              </p>
            </div>
            
            {/* Input Field - Enhanced ChatGPT Style */}
            <div className="w-full max-w-4xl">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-600 shadow-xl focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-2xl transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full resize-none bg-transparent px-5 py-4 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base leading-relaxed"
                    rows={1}
                    disabled={isSending}
                    style={{ maxHeight: '200px', minHeight: '56px' }}
                  />
                  
                  {/* Enhanced Action Buttons */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {!inputMessage.trim() && (
                      <>
                        {/* Voice Call Button - Enhanced */}
                        <button
                          onClick={handleVoiceCall}
                          disabled={isSending || isRecording || isRequestingMic}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isInCall
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:shadow-md'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isInCall ? 'إنهاء المكالمة' : isRequestingMic ? 'جاري طلب إذن الميكروفون...' : 'مكالمة صوتية'}
                        >
                          {isInCall ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/>
                            </svg>
                          ) : isRequestingMic ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Record Button - Enhanced */}
                        <button
                          onClick={handleRecord}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:shadow-md'
                          }`}
                          title={isRecording ? 'إيقاف التسجيل' : isRequestingMic ? 'جاري طلب إذن الميكروفون...' : 'تسجيل صوتي'}
                        >
                          {isRecording ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : isRequestingMic ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    
                    {/* Send Button - Enhanced */}
                    {inputMessage.trim() && (
                      <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                        title="إرسال"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Messages Area - ChatGPT Style */
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message, index) => (
                <div key={message.id} className="mb-6">
                  <div className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {message.role === 'assistant' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#19C37D] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    )}
                    
                    <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                      <div className={`${
                        message.role === 'user' 
                          ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-2xl px-4 py-3 max-w-[80%]'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed text-base">{message.content}</p>
                      </div>
                    </div>
                    
                    {message.role === 'user' && (
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {isSending && (
                <div className="mb-6">
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#19C37D] flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex gap-1 py-3">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* Input Area: Enhanced ChatGPT Style */}
        {messages.length > 0 && (
          <div className="sticky bottom-0 border-t border-gray-200/80 dark:border-gray-700/80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm px-4 py-3 pb-safe">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-600 shadow-xl focus-within:border-blue-500 dark:focus-within:border-blue-400 focus-within:shadow-2xl transition-all duration-200">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="اكتب رسالتك هنا..."
                    className="w-full resize-none bg-transparent px-5 py-4 pr-16 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base leading-relaxed"
                    rows={1}
                    disabled={isSending}
                    style={{ maxHeight: '200px', minHeight: '56px' }}
                  />
                  
                  {/* Enhanced Action Buttons */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {!inputMessage.trim() && (
                      <>
                        {/* Voice Call Button - Enhanced */}
                        <button
                          onClick={handleVoiceCall}
                          disabled={isSending || isRecording || isRequestingMic}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isInCall
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg'
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:shadow-md'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isInCall ? 'إنهاء المكالمة' : isRequestingMic ? 'جاري طلب إذن الميكروفون...' : 'مكالمة صوتية'}
                        >
                          {isInCall ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/>
                            </svg>
                          ) : isRequestingMic ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        
                        {/* Record Button - Enhanced */}
                        <button
                          onClick={handleRecord}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-lg' 
                              : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:shadow-md'
                          }`}
                          title={isRecording ? 'إيقاف التسجيل' : isRequestingMic ? 'جاري طلب إذن الميكروفون...' : 'تسجيل صوتي'}
                        >
                          {isRecording ? (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : isRequestingMic ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-400 border-t-transparent"></div>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    
                    {/* Send Button - Enhanced */}
                    {inputMessage.trim() && (
                      <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-full transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                        title="إرسال"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14m-7-7l7 7-7 7" />
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Recording Indicator */}
      {isRecording && (
        <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 z-50 animate-pulse">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full"></div>
          <span className="text-xs sm:text-sm font-medium">جاري التسجيل...</span>
        </div>
      )}
      
      {/* Call Indicator */}
      {isInCall && (
        <div className="fixed top-16 sm:top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg flex items-center gap-1.5 sm:gap-2 z-50 animate-pulse">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-ping"></div>
          <span className="text-xs sm:text-sm font-medium">مكالمة نشطة...</span>
        </div>
      )}
    </div>
  )
}