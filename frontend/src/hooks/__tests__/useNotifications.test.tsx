import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotifications } from '../useNotifications'
import * as notificationService from '../../api/notificationService'

// Mock the notification service
jest.mock('../../api/notificationService')

describe('useNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const mockNotifications = [
    {
      id: 1,
      user_id: 1,
      title: 'Test Notification 1',
      message: 'This is a test notification',
      type: 'INFO' as const,
      read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: 1,
      title: 'Test Notification 2',
      message: 'This is another test notification',
      type: 'SUCCESS' as const,
      read: true,
      created_at: new Date().toISOString()
    }
  ]

  it('should fetch notifications on mount', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    
    const { result } = renderHook(() => useNotifications())
    
    expect(result.current.loading).toBe(true)
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.notifications).toEqual(mockNotifications)
    expect(result.current.unreadCount).toBe(1)
  })

  it('should poll for new notifications at specified interval', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    
    const pollInterval = 5000 // 5 seconds
    const { result } = renderHook(() => useNotifications(pollInterval))
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(notificationService.fetchNotifications).toHaveBeenCalledTimes(1)
    
    // Advance timers by poll interval
    act(() => {
      jest.advanceTimersByTime(pollInterval)
    })
    
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalledTimes(2)
    })
  })

  it('should mark notification as read', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    ;(notificationService.markAsRead as jest.Mock).mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useNotifications())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const unreadNotification = mockNotifications[0]
    
    await act(async () => {
      await result.current.markAsRead(unreadNotification.id)
    })
    
    expect(notificationService.markAsRead).toHaveBeenCalledWith(unreadNotification.id)
    expect(result.current.unreadCount).toBe(0)
  })

  it('should mark all notifications as read', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    ;(notificationService.markAllAsRead as jest.Mock).mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useNotifications())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.markAllAsRead()
    })
    
    expect(notificationService.markAllAsRead).toHaveBeenCalled()
    expect(result.current.unreadCount).toBe(0)
  })

  it('should delete a notification', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    ;(notificationService.deleteNotification as jest.Mock).mockResolvedValue(undefined)
    
    const { result } = renderHook(() => useNotifications())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const notificationToDelete = mockNotifications[0]
    
    await act(async () => {
      await result.current.deleteNotification(notificationToDelete.id)
    })
    
    expect(notificationService.deleteNotification).toHaveBeenCalledWith(notificationToDelete.id)
    expect(result.current.notifications).toHaveLength(1)
    expect(result.current.notifications[0].id).toBe(2)
  })

  it('should handle fetch error gracefully', async () => {
    const mockError = new Error('Failed to fetch notifications')
    ;(notificationService.fetchNotifications as jest.Mock).mockRejectedValue(mockError)
    
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    const { result } = renderHook(() => useNotifications())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.notifications).toEqual([])
    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch notifications:', mockError)
    
    consoleErrorSpy.mockRestore()
  })

  it('should cleanup polling on unmount', async () => {
    ;(notificationService.fetchNotifications as jest.Mock).mockResolvedValue(mockNotifications)
    
    const { unmount } = renderHook(() => useNotifications(5000))
    
    await waitFor(() => {
      expect(notificationService.fetchNotifications).toHaveBeenCalledTimes(1)
    })
    
    unmount()
    
    // Advance timers to ensure polling doesn't continue
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    
    // Should still be 1 call (no additional calls after unmount)
    expect(notificationService.fetchNotifications).toHaveBeenCalledTimes(1)
  })
})
