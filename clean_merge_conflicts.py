# Script to clean merge conflict markers from files
import os
import re

def clean_file(filepath):
    """Remove merge conflict markers from a file"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Remove conflict markers
        content = re.sub(r'<<<<<<< HEAD\s*', '', content)
        content = re.sub(r'=======\s*', '', content)
        content = re.sub(r'>>>>>>> [a-f0-9]+\s*', '', content)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
            
        print(f"Cleaned merge conflicts from {filepath}")
        return True
    except Exception as e:
        print(f"Error cleaning {filepath}: {e}")
        return False

if __name__ == "__main__":
    filepath = r"c:\Thesis Management System\frontend\src\pages\thesis-management\ThesisManagementPage.tsx"
    if os.path.exists(filepath):
        clean_file(filepath)
    else:
        print(f"File not found: {filepath}")