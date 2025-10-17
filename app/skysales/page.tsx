"use client"

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { getToken, getUser } from '../lib/token-storage'
import NavBar from '../components/NavBar'
import { AI_AGENT_ENDPOINTS } from '../lib/constants'
import { AudioRecorder, ChunkedAudioRecorder, blobToBase64, playAudioBase64 } from '../lib/audio-utils'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function SkySalesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [sessionId, setSessionId] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const audioRecorderRef = useRef<AudioRecorder | null>(null)
  const callRecorderRef = useRef<ChunkedAudioRecorder | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login')
      return
    }

    // No welcome message - clean like ChatGPT
    setMessages([])
    setLoading(false)
  }, [router])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    adjustTextareaHeight()
  }, [inputMessage])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px'
    }
  }

  // API call to send message to AI agent
  const sendMessageToAPI = async (message: string): Promise<string> => {
    const token = getToken()
    if (!token) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }
    
    console.log('Sending message to API:', { 
      message, 
      endpoint: AI_AGENT_ENDPOINTS.CHAT,
      token: token.substring(0, 10) + '...' 
    })

    try {
      const response = await fetch(AI_AGENT_ENDPOINTS.CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({
          message: message
        })
      })

      console.log('API Response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        let headersObject: Record<string, string> = {}
        try {
          headersObject = Object.fromEntries(response.headers.entries())
        } catch (_e) {
          // ignore header extraction errors
        }

        console.error('API Error:', response.status, response.statusText)
        console.error('API Endpoint:', AI_AGENT_ENDPOINTS.CHAT)
        console.error('API Error Headers:', headersObject)
        console.error('API Error Body:', errorText)
        
        // Try to parse error message from response
        let errorMessage = `فشل الاتصال بالخادم (${response.status})`
        let lowerErrorText = (errorText || '').toLowerCase()
        try {
          const errorData = JSON.parse(errorText || '{}') as any
          const rawMsg = errorData?.message || errorData?.detail || errorData?.error
          if (rawMsg) {
            errorMessage = String(rawMsg)
            lowerErrorText = errorMessage.toLowerCase()
          }
        } catch (_parseError) {
          // ignore parse errors
        }

        // Detect OpenAI rate limit bubbled from backend
        if (lowerErrorText.includes('rate limit') || lowerErrorText.includes('429')) {
          errorMessage = 'تم تجاوز حد الاستخدام المؤقت للخدمة. يرجى المحاولة لاحقاً.'
        }
        
        // Map common statuses to friendlier messages
        if (response.status === 401) {
          errorMessage = 'يرجى تسجيل الدخول مرة أخرى.'
        } else if (response.status === 502 || response.status === 503) {
          errorMessage = 'الخادم غير متاح حالياً. حاول لاحقاً.'
        }

        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('API Response data:', data)
      
      // Update session ID
      if (data.session_id && !sessionId) {
        setSessionId(data.session_id)
      }

      return data.message || 'لم يتم الحصول على رد من الخادم'
    } catch (error) {
      console.error('Network or parsing error:', error)
      if (error instanceof Error) {
        throw error
      }
      throw new Error('حدث خطأ في الاتصال بالخادم')
    }
  }

  const handleSend = async () => {
    if (!inputMessage.trim() || isSending) return

    const messageText = inputMessage
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsSending(true)

    try {
      // Call AI API
      const responseText = await sendMessageToAPI(messageText)

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Show error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false)
      setIsSending(true)

      try {
        if (!audioRecorderRef.current) {
          throw new Error('Audio recorder not initialized')
        }

        // Get recorded audio
        const audioBlob = await audioRecorderRef.current.stop()
        
        // Convert to base64
        const audioBase64 = await blobToBase64(audioBlob)

        // Send to Voice API
        const token = getToken()
        if (!token) {
          throw new Error('No authentication token')
        }

        console.log('Sending voice to API:', { 
          endpoint: AI_AGENT_ENDPOINTS.VOICE,
          audioSize: audioBase64.length,
          token: token.substring(0, 10) + '...' 
        })

        const response = await fetch(AI_AGENT_ENDPOINTS.VOICE, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`
          },
          body: JSON.stringify({
            audio_base64: audioBase64
          })
        })

        console.log('Voice API Response status:', response.status, response.statusText)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('Voice API Error Details:', {
            status: response.status,
            statusText: response.statusText,
            body: errorText
          })
          
          let errorMessage = 'فشل معالجة الصوت'
          try {
            const errorData = JSON.parse(errorText)
            if (errorData.message) {
              errorMessage = errorData.message
            }
          } catch (parseError) {
            console.warn('Could not parse voice error response:', parseError)
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()

        // Update session ID
        if (data.session_id && !sessionId) {
          setSessionId(data.session_id)
        }

        // Add user message (transcription)
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          content: data.transcription,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, userMessage])

        // Add assistant response
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.text,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, assistantMessage])

        // Play audio response
        try {
          await playAudioBase64(data.audio_base64)
        } catch (audioError) {
          console.error('Error playing audio:', audioError)
        }

      } catch (error) {
        console.error('Error processing voice:', error)
        
        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'عذراً، حدث خطأ في معالجة الصوت. الرجاء المحاولة مرة أخرى.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      } finally {
        setIsSending(false)
      }
    } else {
      // Start recording
      try {
        audioRecorderRef.current = new AudioRecorder()
        await audioRecorderRef.current.start()
        setIsRecording(true)
      } catch (error) {
        console.error('Error starting recording:', error)
        alert('عذراً، لا يمكن الوصول للميكروفون. الرجاء السماح بالوصول للميكروفون.')
      }
    }
  }

  const handleVoiceCall = async () => {
    if (isInCall) {
      // Stop call
      if (callRecorderRef.current) {
        callRecorderRef.current.stop()
        callRecorderRef.current = null
      }
      setIsInCall(false)
    } else {
      // Start call
      try {
        const token = getToken()
        if (!token) {
          alert('يجب تسجيل الدخول أولاً')
          return
        }

        callRecorderRef.current = new ChunkedAudioRecorder()
        
        await callRecorderRef.current.start(async (audioChunk) => {
          try {
            // Convert chunk to base64
            const chunkBase64 = await blobToBase64(audioChunk)

            // Send to Call API
            console.log('Sending call chunk to API:', { 
              endpoint: AI_AGENT_ENDPOINTS.CALL,
              chunkSize: chunkBase64.length,
              token: token.substring(0, 10) + '...' 
            })

            const response = await fetch(AI_AGENT_ENDPOINTS.CALL, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${token}`
              },
              body: JSON.stringify({
                audio_chunk_base64: chunkBase64
              })
            })

            console.log('Call API Response status:', response.status, response.statusText)

            if (!response.ok) {
              const errorText = await response.text()
              console.error('Call API Error Details:', {
                status: response.status,
                statusText: response.statusText,
                body: errorText
              })
              return
            }

            const data = await response.json()

            // Update session ID
            if (data.session_id && !sessionId) {
              setSessionId(data.session_id)
            }

            // If we got a response
            if (data.text_response && data.text_response.trim()) {
              // Add messages to chat
              const assistantMessage: ChatMessage = {
                id: Date.now().toString(),
                role: 'assistant',
                content: data.text_response,
                timestamp: new Date()
              }
              setMessages(prev => [...prev, assistantMessage])

              // Play audio response
              if (data.audio_response_base64) {
                try {
                  await playAudioBase64(data.audio_response_base64)
                } catch (audioError) {
                  console.error('Error playing call audio:', audioError)
                }
              }
            }
          } catch (error) {
            console.error('Error processing call chunk:', error)
          }
        }, 2000) // Send chunks every 2 seconds

        setIsInCall(true)
      } catch (error) {
        console.error('Error starting call:', error)
        alert('عذراً، لا يمكن بدء المكالمة. الرجاء التحقق من إذن الميكروفون.')
      }
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
            
            {/* Input Field - Centered like ChatGPT */}
            <div className="w-full max-w-3xl">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-lg focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="أرسل رسالة إلى SkySales"
                    className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base leading-relaxed"
                    rows={1}
                    disabled={isSending}
                    style={{ maxHeight: '200px', minHeight: '52px' }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {!inputMessage.trim() && (
                      <>
                        <button
                          onClick={handleVoiceCall}
                          disabled={isSending || isRecording}
                          className={`p-2 rounded-lg transition-all ${
                            isInCall
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isInCall ? 'إنهاء المكالمة' : 'مكالمة صوتية'}
                        >
                          {isInCall ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={handleRecord}
                          className={`p-2 rounded-lg transition-all ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                          title={isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                        >
                          {isRecording ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    
                    {inputMessage.trim() && (
                      <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="p-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white dark:text-gray-900 rounded-lg transition-all flex items-center justify-center disabled:cursor-not-allowed"
                        title="إرسال"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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

        {/* Input Area: Fixed at bottom like ChatGPT */}
        {messages.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-600 shadow-lg focus-within:border-gray-400 dark:focus-within:border-gray-500 transition-all">
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="أرسل رسالة إلى SkySales"
                    className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none text-base leading-relaxed"
                    rows={1}
                    disabled={isSending}
                    style={{ maxHeight: '200px', minHeight: '52px' }}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                    {!inputMessage.trim() && (
                      <>
                        <button
                          onClick={handleVoiceCall}
                          disabled={isSending || isRecording}
                          className={`p-2 rounded-lg transition-all ${
                            isInCall
                              ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={isInCall ? 'إنهاء المكالمة' : 'مكالمة صوتية'}
                        >
                          {isInCall ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                              <line x1="18" y1="6" x2="6" y2="18" stroke="white" strokeWidth="2"/>
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          )}
                        </button>
                        
                        <button
                          onClick={handleRecord}
                          className={`p-2 rounded-lg transition-all ${
                            isRecording 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                          }`}
                          title={isRecording ? 'إيقاف التسجيل' : 'تسجيل صوتي'}
                        >
                          {isRecording ? (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                              <rect x="6" y="6" width="12" height="12" rx="2" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                          )}
                        </button>
                      </>
                    )}
                    
                    {inputMessage.trim() && (
                      <button
                        onClick={handleSend}
                        disabled={isSending}
                        className="p-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white dark:text-gray-900 rounded-lg transition-all flex items-center justify-center disabled:cursor-not-allowed"
                        title="إرسال"
                      >
                        {isSending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white dark:border-gray-900 border-t-transparent"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
