"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { getToken, removeToken, getUser } from '../lib/token-storage'
import { NAVIGATION_ITEMS, ROUTES } from '../lib/constants'
import type { NavigationItem } from '../lib/types'
import NotificationBadge from './NotificationBadge'

interface NavLinkProps {
  href: string
  label: string
  isActive?: boolean
}

function NavLink({ href, label, isActive = false }: NavLinkProps) {
  return (
    <Link 
      href={href} 
      className={`px-3 py-2 rounded-lg transition-colors font-medium ${
        isActive 
          ? 'bg-[#FF6B35] text-white' 
          : 'text-white/90 hover:bg-white/10 hover:text-white'
      }`}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  )
}

interface NavBarProps {
  className?: string
}

export default function NavBar({ className }: NavBarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [username, setUsername] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    setIsClient(true)
    setToken(getToken())
    setUsername(getUser())
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) return
      try {
        const response = await fetch('/api/profiles/user-profile', {
          headers: {
            'Authorization': `Token ${token}`
          }
        })
        if (!response.ok) return
        const data = await response.json()
        if (data?.user?.name) {
          setUsername(data.user.name)
        }
      } catch (_err) {
        // silent
      }
    }
    fetchProfile()
  }, [token])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])


  const handleLogout = useCallback(() => {
    removeToken()
    setToken(null)
    setUsername(null)
    setIsDropdownOpen(false)
    router.replace(ROUTES.LOGIN)
  }, [router])


  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  return (
    <header className={`border-b bg-[#1E2A3A] dark:bg-[#1E2A3A] shadow-sm ${className || ''}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between p-2 sm:p-3">
        <div className="flex items-center gap-1 sm:gap-2 flex-1">
          <Link 
            href={ROUTES.DASHBOARD} 
            className="font-semibold text-lg sm:text-xl text-white hover:text-[#FF6B35] transition-colors flex items-center gap-1 sm:gap-2"
            aria-label="الصفحة الرئيسية"
          >
            <span className="hidden sm:inline">pharmasky</span>
            <span className="sm:hidden">pharma</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex ml-4 items-center gap-1 text-sm" role="navigation" aria-label="التنقل الرئيسي">
            {NAVIGATION_ITEMS.map((item: NavigationItem) => (
              <NavLink 
                key={item.href}
                href={item.href!} 
                label={item.label}
                isActive={pathname?.startsWith(item.href!)}
              />
            ))}
            {/* Notifications Link */}
            <Link 
              href="/notifications"
              className={`px-3 py-2 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                pathname?.startsWith('/notifications')
                  ? 'bg-[#FF6B35] text-white' 
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <NotificationBadge />
              <span>الإشعارات</span>
            </Link>
          </nav>
        </div>
        

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
          aria-label="فتح القائمة"
          aria-expanded={isMobileMenuOpen}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
        
        {/* Desktop User Menu */}
        <div className="hidden lg:block text-sm relative" ref={dropdownRef}>
          {!isClient ? (
            <div className="px-4 py-2 rounded-lg border border-white/20 opacity-50" aria-hidden="true">
              <span className="invisible text-white">تسجيل دخول</span>
            </div>
          ) : token ? (
            <div className="relative">
              <button 
                className="px-4 py-2 rounded-lg border border-white/30 hover:border-white/50 hover:bg-white/10 transition-colors flex items-center gap-2 text-white" 
                onClick={toggleDropdown}
                type="button"
                aria-label="قائمة المستخدم"
                aria-expanded={isDropdownOpen}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium">{username || 'مستخدم'}</span>
                <svg 
                  className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#1A1F2E] border border-[#E8ECEF] dark:border-[#252B3A] rounded-xl shadow-xl py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#E8ECEF] dark:border-[#252B3A]">
                    <p className="text-sm font-semibold text-[#1E2A3A] dark:text-[#E8ECEF]">{username}</p>
                    <p className="text-xs text-[#95A3B3]">صيدلية</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-right px-4 py-2 text-sm hover:bg-[#FADBD8] dark:hover:bg-[#3A1F1C] transition-colors flex items-center gap-2 text-[#E74C3C] font-medium mt-1"
                    type="button"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    تسجيل خروج
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link 
              className="btn-primary text-sm px-4 py-2" 
              href={ROUTES.LOGIN}
            >
              تسجيل الدخول
            </Link>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-white/20 bg-[#253648] animate-slideDown">
          <nav className="px-3 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {NAVIGATION_ITEMS.map((item: NavigationItem) => (
              <Link
                key={item.href}
                href={item.href!}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg transition-colors font-medium ${
                  pathname?.startsWith(item.href!)
                    ? 'bg-[#FF6B35] text-white'
                    : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Mobile Notifications Link */}
            <Link
              href="/notifications"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg transition-colors font-medium flex items-center gap-2 ${
                pathname?.startsWith('/notifications')
                  ? 'bg-[#FF6B35] text-white'
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <NotificationBadge />
              <span>الإشعارات</span>
            </Link>
            
            {/* Mobile User Menu */}
            <div className="pt-4 mt-4 border-t border-white/20">
              {isClient && (
                token ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2.5 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-2 text-white">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-semibold">{username || 'مستخدم'}</span>
                      </div>
                      <p className="text-xs text-white/60 mt-1 mr-7">صيدلية</p>
                    </div>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="w-full text-right px-3 py-2.5 text-sm bg-[#E74C3C]/10 text-[#E74C3C] hover:bg-[#E74C3C]/20 rounded-lg transition-colors flex items-center gap-2 font-medium"
                      type="button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      تسجيل خروج
                    </button>
                  </div>
                ) : (
                  <Link
                    href={ROUTES.LOGIN}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2.5 text-sm btn-primary rounded-lg text-center font-semibold"
                  >
                    تسجيل الدخول
                  </Link>
                )
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}


