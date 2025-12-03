import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { DocumentUploadDialog } from '../DocumentUploadDialog';
import { Thesis } from '../../../types';

// Mock the uploadDocument function
jest.mock('../../../api/documentService', () => ({
  uploadDocument: jest.fn(),
}));

const mockThesis: Thesis = {
  id: '1',
  title: 'Test Thesis',
  abstract: 'Test abstract',
  keywords: 'test, thesis',
  group: 'group1',
  proposer: {
    id: 1,
    email: 'student@test.com',
    first_name: 'Test',
    last_name: 'Student',
    role: 'STUDENT',
    is_active: true,
    is_staff: false,
  },
  status: 'TOPIC_APPROVED', // Allows concept paper upload
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockOnUploadSuccess = jest.fn();

describe('DocumentUploadDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the trigger button', () => {
    render(
      <DocumentUploadDialog thesis={mockThesis} onUploadSuccess={mockOnUploadSuccess}>
        <button>Upload Document</button>
      </DocumentUploadDialog>
    );

    expect(screen.getByRole('button', { name: /Upload Document/i })).toBeInTheDocument();
  });

  it('does not render when thesis status is TOPIC_SUBMITTED', () => {
    const thesisWithTopicSubmitted: Thesis = {
      ...mockThesis,
      status: 'TOPIC_SUBMITTED', // No document types allowed for this status
    };

    const { container } = render(
      <DocumentUploadDialog thesis={thesisWithTopicSubmitted} onUploadSuccess={mockOnUploadSuccess}>
        <button>Upload Document</button>
      </DocumentUploadDialog>
    );

    // Should not render anything
    expect(container.firstChild).toBeNull();
  });

  it('renders when thesis status is not TOPIC_SUBMITTED', () => {
    const thesisWithApprovedStatus: Thesis = {
      ...mockThesis,
      status: 'TOPIC_APPROVED', // Document types allowed for this status
    };

    const { container } = render(
      <DocumentUploadDialog thesis={thesisWithApprovedStatus} onUploadSuccess={mockOnUploadSuccess}>
        <button>Upload Document</button>
      </DocumentUploadDialog>
    );

    // Should render the button
    expect(container.firstChild).not.toBeNull();
    expect(screen.getByRole('button', { name: /Upload Document/i })).toBeInTheDocument();
  });
});