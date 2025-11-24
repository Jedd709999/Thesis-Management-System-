import { renderHook, act } from '@testing-library/react'
import { useAuth } from '../useAuth'
import * as authService from '../../api/authService'

// Mock the auth service
jest.mock('../../api/authService')

describe('useAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('should initialize with no user and not loading', () => {
    const { result } = renderHook(() => useAuth())
    
    expect(result.current.user).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should load user from localStorage on mount', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'STUDENT' as const
    }
    
    localStorage.setItem('user', JSON.stringify(mockUser))
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      // Wait for effect to run
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should login successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'STUDENT' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const mockToken = 'mock-token'
    
    ;(authService.login as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: mockToken
    })
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.login('test@example.com', 'password')
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
    expect(localStorage.getItem('token')).toBe(mockToken)
    expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
  })

  it('should handle login error', async () => {
    const mockError = new Error('Invalid credentials')
    ;(authService.login as jest.Mock).mockRejectedValue(mockError)
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      try {
        await result.current.login('test@example.com', 'wrong-password')
      } catch (error) {
        expect(error).toBe(mockError)
      }
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should logout successfully', async () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      first_name: 'Test',
      last_name: 'User',
      role: 'STUDENT' as const
    }
    
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('token', 'mock-token')
    
    const { result } = renderHook(() => useAuth())
    
    await act(async () => {
      await result.current.logout()
    })
    
    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })

  it('should register successfully', async () => {
    const mockUser = {
      id: 2,
      email: 'newuser@example.com',
      first_name: 'New',
      last_name: 'User',
      role: 'STUDENT' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    const mockToken = 'new-token'
    
    ;(authService.register as jest.Mock).mockResolvedValue({
      user: mockUser,
      token: mockToken
    })
    
    const { result } = renderHook(() => useAuth())
    
    const registerData = {
      email: 'newuser@example.com',
      password: 'password',
      first_name: 'New',
      last_name: 'User',
      role: 'STUDENT' as const
    }
    
    await act(async () => {
      await result.current.register(registerData)
    })
    
    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })
})
