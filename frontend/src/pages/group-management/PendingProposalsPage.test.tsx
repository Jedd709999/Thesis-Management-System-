import { render, screen, waitFor } from '@testing-library/react';
import { PendingProposals } from './PendingProposalsPage';
import * as groupService from '../../api/groupService';
import { Group, User } from '../../types';
import { toast } from 'sonner';

// Mock the toast implementation
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

// Mock the useNavigate hook
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

describe('PendingProposals', () => {
  const mockUser1: User = {
    id: 1,
    email: 'john@example.com',
    first_name: 'John',
    last_name: 'Doe',
    role: 'STUDENT',
    is_active: true,
    is_staff: false
  };

  const mockUser2: User = {
    id: 2,
    email: 'jane@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role: 'STUDENT',
    is_active: true,
    is_staff: false
  };

  const mockProposals: Group[] = [
    {
      id: '1',
      name: 'Test Group 1',
      status: 'PENDING',
      proposed_topic_title: 'Test topic 1\nTest topic 2\nTest topic 3',
      members: [mockUser1, mockUser2],
      leader: mockUser1,
      adviser: null,
      panels: [],
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pending proposals correctly', async () => {
    // Mock the fetchPendingProposals function
    jest.spyOn(groupService, 'fetchPendingProposals').mockResolvedValue(mockProposals);
    
    render(<PendingProposals onViewDetail={jest.fn()} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check if the proposal is rendered
    expect(screen.getByText('Test Group 1')).toBeInTheDocument();
    expect(screen.getByText('PENDING')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows empty state when no proposals', async () => {
    // Mock the fetchPendingProposals function to return empty array
    jest.spyOn(groupService, 'fetchPendingProposals').mockResolvedValue([]);
    
    render(<PendingProposals onViewDetail={jest.fn()} />);
    
    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
    
    // Check if empty state is shown
    expect(screen.getByText('No Pending Proposals')).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    // Mock the fetchPendingProposals function to throw an error
    jest.spyOn(groupService, 'fetchPendingProposals').mockRejectedValue(new Error('Failed to fetch'));
    
    render(<PendingProposals onViewDetail={jest.fn()} />);
    
    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.getByText('Error Loading Proposals')).toBeInTheDocument();
    });
  });
});