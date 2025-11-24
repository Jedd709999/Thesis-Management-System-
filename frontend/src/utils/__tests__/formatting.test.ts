import { formatDate, formatRelativeTime, getInitials, getStatusColor } from '../formatting'

describe('formatting utilities', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const date = '2024-11-23T10:30:00.000Z'
      const formatted = formatDate(date)
      
      expect(formatted).toMatch(/Nov 23, 2024/)
    })

    it('should handle Date objects', () => {
      const date = new Date('2024-11-23T10:30:00.000Z')
      const formatted = formatDate(date)
      
      expect(formatted).toMatch(/Nov 23, 2024/)
    })

    it('should include time when showTime is true', () => {
      const date = '2024-11-23T10:30:00.000Z'
      const formatted = formatDate(date, true)
      
      expect(formatted).toMatch(/Nov 23, 2024.*10:30/)
    })
  })

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      jest.setSystemTime(new Date('2024-11-23T12:00:00.000Z'))
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('should format recent times correctly', () => {
      const oneMinuteAgo = new Date('2024-11-23T11:59:00.000Z').toISOString()
      expect(formatRelativeTime(oneMinuteAgo)).toBe('1 minute ago')
    })

    it('should format hours correctly', () => {
      const twoHoursAgo = new Date('2024-11-23T10:00:00.000Z').toISOString()
      expect(formatRelativeTime(twoHoursAgo)).toBe('2 hours ago')
    })

    it('should format days correctly', () => {
      const threeDaysAgo = new Date('2024-11-20T12:00:00.000Z').toISOString()
      expect(formatRelativeTime(threeDaysAgo)).toBe('3 days ago')
    })

    it('should format weeks correctly', () => {
      const twoWeeksAgo = new Date('2024-11-09T12:00:00.000Z').toISOString()
      expect(formatRelativeTime(twoWeeksAgo)).toBe('2 weeks ago')
    })

    it('should format months correctly', () => {
      const twoMonthsAgo = new Date('2024-09-23T12:00:00.000Z').toISOString()
      expect(formatRelativeTime(twoMonthsAgo)).toBe('2 months ago')
    })

    it('should handle "just now" for very recent times', () => {
      const now = new Date('2024-11-23T12:00:00.000Z').toISOString()
      expect(formatRelativeTime(now)).toBe('just now')
    })
  })

  describe('getInitials', () => {
    it('should get initials from first and last name', () => {
      expect(getInitials('John', 'Doe')).toBe('JD')
    })

    it('should handle single names', () => {
      expect(getInitials('John', '')).toBe('J')
      expect(getInitials('', 'Doe')).toBe('D')
    })

    it('should handle empty names', () => {
      expect(getInitials('', '')).toBe('?')
    })

    it('should handle lowercase names', () => {
      expect(getInitials('john', 'doe')).toBe('JD')
    })

    it('should handle names with multiple words', () => {
      expect(getInitials('Mary Jane', 'Watson')).toBe('MW')
    })
  })

  describe('getStatusColor', () => {
    it('should return correct color for PENDING status', () => {
      expect(getStatusColor('PENDING')).toBe('yellow')
    })

    it('should return correct color for APPROVED status', () => {
      expect(getStatusColor('APPROVED')).toBe('green')
    })

    it('should return correct color for REJECTED status', () => {
      expect(getStatusColor('REJECTED')).toBe('red')
    })

    it('should return correct color for IN_PROGRESS status', () => {
      expect(getStatusColor('IN_PROGRESS')).toBe('blue')
    })

    it('should return correct color for SUBMITTED status', () => {
      expect(getStatusColor('SUBMITTED')).toBe('purple')
    })

    it('should return correct color for UNDER_REVIEW status', () => {
      expect(getStatusColor('UNDER_REVIEW')).toBe('blue')
    })

    it('should return correct color for SCHEDULED status', () => {
      expect(getStatusColor('SCHEDULED')).toBe('green')
    })

    it('should return correct color for COMPLETED status', () => {
      expect(getStatusColor('COMPLETED')).toBe('green')
    })

    it('should return correct color for CANCELLED status', () => {
      expect(getStatusColor('CANCELLED')).toBe('gray')
    })

    it('should return gray for unknown status', () => {
      expect(getStatusColor('UNKNOWN_STATUS')).toBe('gray')
    })

    it('should be case-insensitive', () => {
      expect(getStatusColor('approved')).toBe('green')
      expect(getStatusColor('Pending')).toBe('yellow')
    })
  })
})
