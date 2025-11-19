# Group Search and Tagging Features

## Overview
The Group model now supports possible topics and keywords for better search and tagging functionality in group proposals.

## New Fields Added

### 1. possible_topics
- **Type**: TextField
- **Format**: One topic per line
- **Purpose**: List of possible research topics for the group
- **Example**:
  ```
  Deep Learning
  Neural Networks
  Computer Vision
  Natural Language Processing
  ```

### 2. keywords
- **Type**: CharField (max 500 chars)
- **Format**: Comma-separated keywords
- **Purpose**: Keywords for search and tagging
- **Example**: `AI, machine learning, deep learning, neural networks`

## API Usage

### Creating/Updating a Group
```json
{
  "name": "Machine Learning Research",
  "possible_topics": "Deep Learning\nNeural Networks\nComputer Vision",
  "keywords": "AI, machine learning, deep learning, neural networks",
  "members": [1, 2, 3],
  "adviser": 4
}
```

### Search Endpoints

#### General Search
Search by name, keywords, or topics:
```
GET /api/groups/?search=machine
GET /api/groups/?search=AI
GET /api/groups/?search=Deep Learning
```

#### Keyword Search
Search specifically by keywords:
```
GET /api/groups/?keywords=AI,machine learning
```

#### Topic Search
Search specifically by topics:
```
GET /api/groups/?topics=Deep Learning,Neural Networks
```

## Model Helper Methods

### Getting Data as Lists
```python
group = Group.objects.get(id=1)

# Get keywords as list
keywords = group.get_keywords_list()
# Returns: ['AI', 'machine learning', 'deep learning', 'neural networks']

# Get topics as list
topics = group.get_topics_list()
# Returns: ['Deep Learning', 'Neural Networks', 'Computer Vision']
```

### Setting Data from Lists
```python
# Set keywords from list
group.set_keywords_from_list(['python', 'data science', 'algorithms'])

# Set topics from list
group.set_topics_from_list(['NLP', 'Transformers', 'BERT'])
```

## Custom Manager Methods

### Search Methods
```python
# General search (searches name, keywords, and topics)
results = Group.objects.search('machine learning')

# Keyword-specific search
results = Group.objects.search_by_keywords('AI')

# Topic-specific search
results = Group.objects.search_by_topics('Deep Learning')
```

## Frontend Integration Tips

### Display Keywords as Tags
```javascript
const keywords = group.keywords.split(',').map(k => k.trim()).filter(k => k);
// Render as chips/tags in UI
```

### Display Topics as List
```javascript
const topics = group.possible_topics.split('\n').map(t => t.trim()).filter(t => t);
// Render as bullet points or list items
```

### Search Implementation
```javascript
// Search groups
const searchGroups = async (query, type = 'general') => {
  let url = '/api/groups/';
  const params = new URLSearchParams();
  
  if (type === 'general') {
    params.append('search', query);
  } else if (type === 'keywords') {
    params.append('keywords', query);
  } else if (type === 'topics') {
    params.append('topics', query);
  }
  
  url += `?${params.toString()}`;
  
  const response = await fetch(url);
  return response.json();
};
```

## Database Migration
The changes have been applied via migration:
- `api/migrations/0004_group_keywords_group_possible_topics.py`

## Testing
Run the test suite to verify functionality:
```bash
python manage.py test api.tests.test_group_search
```

## Benefits
1. **Improved Search**: Groups can be found by topics or keywords
2. **Better Tagging**: Keywords allow for flexible categorization
3. **Enhanced Discovery**: Students can find groups based on research interests
4. **Flexible Data Storage**: Text fields allow for rich content while maintaining searchability
