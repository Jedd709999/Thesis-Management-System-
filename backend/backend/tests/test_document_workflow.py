import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from api.models import Thesis, Group, Document

User = get_user_model()

@pytest.mark.django_db
class TestDocumentWorkflow:
    """Test document upload workflow with thesis status transitions"""

    def test_concept_paper_upload_workflow(self, authenticated_client, student_user):
        """Test concept paper upload workflow"""
        # Create a group and thesis for the document
        group = Group.objects.create(
            name='Test Group',
            status='APPROVED'
        )
        group.members.add(student_user)
        
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student_user,
            status='TOPIC_APPROVED'  # Prerequisite for concept paper upload
        )
        
        # Create a test PDF file
        test_file = SimpleUploadedFile(
            "concept_paper.pdf",
            b"fake pdf content",
            content_type="application/pdf"
        )
        
        data = {
            'thesis': thesis.id,
            'title': 'Concept Paper',
            'file': test_file,
            'document_type': 'concept_paper',
            'convert_to_google_doc': 'false'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['document_type'] == 'concept_paper'
        assert response.data['title'] == 'Concept Paper'
        
        # Refresh thesis from database
        thesis.refresh_from_db()
        assert thesis.status == 'CONCEPT_SUBMITTED'

    def test_research_proposal_upload_workflow(self, authenticated_client, student_user):
        """Test research proposal upload workflow"""
        # Create a group and thesis for the document
        group = Group.objects.create(
            name='Test Group',
            status='APPROVED'
        )
        group.members.add(student_user)
        
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student_user,
            status='CONCEPT_APPROVED'  # Prerequisite for research proposal upload
        )
        
        # Create a test PDF file
        test_file = SimpleUploadedFile(
            "research_proposal.pdf",
            b"fake pdf content",
            content_type="application/pdf"
        )
        
        data = {
            'thesis': thesis.id,
            'title': 'Research Proposal',
            'file': test_file,
            'document_type': 'research_proposal',
            'convert_to_google_doc': 'false'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['document_type'] == 'research_proposal'
        assert response.data['title'] == 'Research Proposal'
        
        # Refresh thesis from database
        thesis.refresh_from_db()
        assert thesis.status == 'PROPOSAL_SUBMITTED'

    def test_final_manuscript_upload_workflow(self, authenticated_client, student_user):
        """Test final manuscript upload workflow"""
        # Create a group and thesis for the document
        group = Group.objects.create(
            name='Test Group',
            status='APPROVED'
        )
        group.members.add(student_user)
        
        thesis = Thesis.objects.create(
            title='Test Thesis',
            abstract='Test abstract',
            group=group,
            proposer=student_user,
            status='PROPOSAL_APPROVED'  # Prerequisite for final manuscript upload
        )
        
        # Create a test PDF file
        test_file = SimpleUploadedFile(
            "final_manuscript.pdf",
            b"fake pdf content",
            content_type="application/pdf"
        )
        
        data = {
            'thesis': thesis.id,
            'title': 'Final Manuscript',
            'file': test_file,
            'document_type': 'final_manuscript',
            'convert_to_google_doc': 'false'
        }
        
        response = authenticated_client.post('/api/documents/', data, format='multipart')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['document_type'] == 'final_manuscript'
        assert response.data['title'] == 'Final Manuscript'
        
        # Refresh thesis from database
        thesis.refresh_from_db()
        assert thesis.status == 'FINAL_SUBMITTED'
