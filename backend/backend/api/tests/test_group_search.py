from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models.group_models import Group

User = get_user_model()

class GroupSearchTestCase(TestCase):
    def setUp(self):
        # Create test users
        self.adviser = User.objects.create_user(
            email='adviser@test.com',
            password='testpass123',
            role='ADVISER'
        )
        
        self.student1 = User.objects.create_user(
            email='student1@test.com',
            password='testpass123',
            role='STUDENT'
        )
        
        # Create test groups
        self.group1 = Group.objects.create(
            name='Machine Learning Research',
            possible_topics='Deep Learning\nNeural Networks\nComputer Vision',
            keywords='AI, machine learning, deep learning, neural networks',
            adviser=self.adviser
        )
        self.group1.members.add(self.student1)
        
        self.group2 = Group.objects.create(
            name='Web Development Team',
            possible_topics='React\nDjango\nFull Stack Development',
            keywords='web, react, django, fullstack',
            adviser=self.adviser
        )
    
    def test_search_by_name(self):
        """Test searching groups by name"""
        results = Group.objects.search('machine')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, 'Machine Learning Research')
    
    def test_search_by_keywords(self):
        """Test searching groups by keywords"""
        results = Group.objects.search_by_keywords('AI')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, 'Machine Learning Research')
        
        results = Group.objects.search_by_keywords('web')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, 'Web Development Team')
    
    def test_search_by_topics(self):
        """Test searching groups by topics"""
        results = Group.objects.search_by_topics('Deep Learning')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, 'Machine Learning Research')
        
        results = Group.objects.search_by_topics('React')
        self.assertEqual(results.count(), 1)
        self.assertEqual(results.first().name, 'Web Development Team')
    
    def test_get_keywords_list(self):
        """Test getting keywords as list"""
        keywords = self.group1.get_keywords_list()
        expected = ['AI', 'machine learning', 'deep learning', 'neural networks']
        self.assertEqual(keywords, expected)
    
    def test_get_topics_list(self):
        """Test getting topics as list"""
        topics = self.group1.get_topics_list()
        expected = ['Deep Learning', 'Neural Networks', 'Computer Vision']
        self.assertEqual(topics, expected)
    
    def test_set_keywords_from_list(self):
        """Test setting keywords from list"""
        new_keywords = ['python', 'data science', 'algorithms']
        self.group1.set_keywords_from_list(new_keywords)
        self.group1.save()
        
        self.assertEqual(self.group1.get_keywords_list(), new_keywords)
    
    def test_set_topics_from_list(self):
        """Test setting topics from list"""
        new_topics = ['Natural Language Processing', 'Transformers', 'BERT']
        self.group1.set_topics_from_list(new_topics)
        self.group1.save()
        
        self.assertEqual(self.group1.get_topics_list(), new_topics)
