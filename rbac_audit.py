#!/usr/bin/env python
"""
RBAC Audit and Patching Script
Audits all API endpoints for proper role-based access control permissions
"""
import os
import sys
import re
from pathlib import Path

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

import django
django.setup()

class RBACAuditor:
    def __init__(self):
        self.views_dir = Path(__file__).parent / 'backend' / 'backend' / 'api' / 'views'
        self.permissions_dir = Path("c:/Thesis Management System/backend/backend/api/permissions")
        self.issues = []
        self.recommendations = []
        
        # Define permission classes that provide role-based access
        self.ROLE_PERMISSIONS = {
            'IsAdmin', 'IsAdviser', 'IsStudent', 'IsPanel'
        }

        # Define permission classes that provide object-level access
        self.OBJECT_PERMISSIONS = {
            'IsOwnerOrAdmin', 'IsGroupMemberOrAdmin', 'IsAdviserOrPanelForSchedule',
            'IsStudentOrAdviserForThesis', 'IsAdviserForGroup', 'CanManageNotifications',
            'IsDocumentOwnerOrGroupMember', 'IsStudentOwner', 'IsAdviserOrReadOnly'
        }
        
    def audit_all_views(self):
        """Audit all view files for RBAC compliance"""
        print("🔍 Starting RBAC Audit...")
        print("=" * 60)
        
        view_files = list(self.views_dir.glob("*_views.py"))
        
        for view_file in view_files:
            print(f"\n📁 Auditing: {view_file.name}")
            self.audit_view_file(view_file)
        
        self.generate_report()
        
    def audit_view_file(self, file_path):
        """Audit a single view file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Find all ViewSet/View classes
            class_pattern = r'class\s+(\w+(?:ViewSet|View))\s*\([^)]*\):'
            classes = re.findall(class_pattern, content)
            
            for class_name in classes:
                self.audit_view_class(content, class_name, file_path.name)
                
        except Exception as e:
            print(f"❌ Error auditing {file_path}: {e}")
            
    def audit_view_class(self, content, class_name, file_name):
        """Audit a specific view class"""
        print(f"  🔍 Class: {class_name}")
        
        # Extract class content
        class_start = content.find(f"class {class_name}")
        if class_start == -1:
            return
            
        # Find next class or end of file
        next_class = content.find("\nclass ", class_start + 1)
        if next_class == -1:
            class_content = content[class_start:]
        else:
            class_content = content[class_start:next_class]
        
        # Check for permission_classes
        permission_match = re.search(r'permission_classes\s*=\s*\[(.*?)\]', class_content, re.DOTALL)
        
        if not permission_match:
            self.issues.append({
                'file': file_name,
                'class': class_name,
                'severity': 'HIGH',
                'issue': 'No permission_classes defined',
                'recommendation': 'Add appropriate permission_classes based on endpoint sensitivity'
            })
            print(f"    ❌ No permission_classes found")
            return
            
        permissions = permission_match.group(1).strip()
        print(f"    ✅ Permissions: [{permissions}]")
        
        # Analyze permission strength
        self.analyze_permissions(class_name, file_name, permissions, class_content)
        
    def analyze_permissions(self, class_name, file_name, permissions, class_content):
        """Analyze if permissions are appropriate for the view"""
        
        # Check for weak permissions
        if 'AllowAny' in permissions:
            self.issues.append({
                'file': file_name,
                'class': class_name,
                'severity': 'CRITICAL',
                'issue': 'AllowAny permission - completely open endpoint',
                'recommendation': 'Replace with IsAuthenticated and role-based permissions'
            })
            print(f"    🚨 CRITICAL: AllowAny permission detected!")
            
        elif 'IsAuthenticated' in permissions and 'IsAdmin' not in permissions:
            # Check if this should have role-based restrictions
            if self.should_have_role_restriction(class_name, file_name, permissions):
                self.issues.append({
                    'file': file_name,
                'class': class_name,
                    'severity': 'HIGH',
                    'issue': 'Only IsAuthenticated - missing role restrictions',
                    'recommendation': f'Add role-based permission (IsAdviser, IsStudent, or IsAdmin)'
                })
                print(f"    ⚠️  WARNING: May need role-based restrictions")
            else:
                print(f"    ✅ Has appropriate role-based permissions")
                
        # Check for object-level permissions
        if self.needs_object_permissions(class_name, class_content):
            if not any(perm in permissions for perm in self.OBJECT_PERMISSIONS):
                self.issues.append({
                    'file': file_name,
                    'class': class_name,
                    'severity': 'MEDIUM',
                    'issue': 'Missing object-level permissions',
                    'recommendation': 'Add object-level permissions for data access control'
                })
                print(f"    ⚠️  WARNING: May need object-level permissions")
            else:
                print(f"    ✅ Has object-level permissions")
                
    def should_have_role_restriction(self, class_name, file_name, permissions):
        """Determine if a view should have role restrictions"""
        # Check if permissions already contain role-based permissions
        if any(perm in permissions for perm in self.ROLE_PERMISSIONS):
            return False
            
        high_risk_views = [
            'UserViewSet', 'ThesisViewSet', 'ScheduleViewSet', 
            'GroupViewSet', 'DocumentViewSet'
        ]
        
        return class_name in high_risk_views
        
    def needs_object_permissions(self, class_name, class_content):
        """Determine if a view needs object-level permissions"""
        # Check for detail routes or object-specific operations
        if '@action(detail=True)' in class_content:
            return True
            
        # Check for get_object usage
        if 'get_object()' in class_content:
            return True
            
        return False
        
    def generate_report(self):
        """Generate audit report"""
        print("\n" + "=" * 60)
        print("📊 RBAC AUDIT REPORT")
        print("=" * 60)
        
        if not self.issues:
            print("✅ No RBAC issues found!")
            return
            
        # Group by severity
        critical = [i for i in self.issues if i['severity'] == 'CRITICAL']
        high = [i for i in self.issues if i['severity'] == 'HIGH']
        medium = [i for i in self.issues if i['severity'] == 'MEDIUM']
        
        print(f"\n🚨 CRITICAL ISSUES: {len(critical)}")
        for issue in critical:
            print(f"  • {issue['file']} - {issue['class']}: {issue['issue']}")
            print(f"    💡 {issue['recommendation']}")
            
        print(f"\n⚠️  HIGH PRIORITY ISSUES: {len(high)}")
        for issue in high:
            print(f"  • {issue['file']} - {issue['class']}: {issue['issue']}")
            print(f"    💡 {issue['recommendation']}")
            
        print(f"\n📋 MEDIUM PRIORITY ISSUES: {len(medium)}")
        for issue in medium:
            print(f"  • {issue['file']} - {issue['class']}: {issue['issue']}")
            print(f"    💡 {issue['recommendation']}")
            
        print(f"\n📈 SUMMARY: {len(self.issues)} total issues found")
        
    def generate_patches(self):
        """Generate patch recommendations"""
        print("\n" + "=" * 60)
        print("🔧 PATCH RECOMMENDATIONS")
        print("=" * 60)
        
        patches = []
        
        for issue in self.issues:
            if issue['severity'] in ['CRITICAL', 'HIGH']:
                patch = self.create_patch(issue)
                if patch:
                    patches.append(patch)
                    
        return patches
        
    def create_patch(self, issue):
        """Create a patch for a specific issue"""
        file_path = self.views_dir / issue['file']
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Generate patch based on issue type
            if 'AllowAny' in issue['issue']:
                return self.patch_allow_any(content, issue)
            elif 'role restrictions' in issue['issue']:
                return self.patch_role_restrictions(content, issue)
                
        except Exception as e:
            print(f"❌ Error creating patch for {issue['file']}: {e}")
            return None
            
    def patch_allow_any(self, content, issue):
        """Create patch to replace AllowAny"""
        class_name = issue['class']
        
        # Determine appropriate permissions based on class name
        if 'UserViewSet' in class_name:
            new_permissions = 'IsAuthenticated, IsAdmin'
        elif 'AuthView' in class_name:
            new_permissions = 'IsAuthenticated'  # Login/register can stay open
        else:
            new_permissions = 'IsAuthenticated'
            
        return {
            'file': issue['file'],
            'class': class_name,
            'type': 'permission_classes',
            'old': 'AllowAny',
            'new': new_permissions,
            'description': f"Replace AllowAny with {new_permissions}"
        }
        
    def patch_role_restrictions(self, content, issue):
        """Create patch to add role restrictions"""
        class_name = issue['class']
        
        ROLE_PERMISSIONS = {
            'IsAdmin', 'IsAdviser', 'IsStudent', 'IsPanel'
        }

        OBJECT_PERMISSIONS = {
            'IsOwnerOrAdmin', 'IsGroupMemberOrAdmin', 'IsAdviserOrPanelForSchedule',
            'IsStudentOrAdviserForThesis', 'IsAdviserForGroup', 'CanManageNotifications',
            'IsDocumentOwnerOrGroupMember', 'IsStudentOwner', 'IsAdviserOrReadOnly'
        }
        
        # Determine role based on class name
        role_mapping = {
            'ThesisViewSet': 'IsStudent',
            'ScheduleViewSet': 'IsAdviser',
            'GroupViewSet': 'IsAdviser',
            'DocumentViewSet': 'IsStudent',
            'UserViewSet': 'IsAdmin'
        }
        
        role = role_mapping.get(class_name, 'IsAuthenticated')
        
        return {
            'file': issue['file'],
            'class': class_name,
            'type': 'permission_classes',
            'old': 'IsAuthenticated',
            'new': f'IsAuthenticated, {role}',
            'description': f"Add {role} role restriction"
        }

def main():
    """Main audit function"""
    auditor = RBACAuditor()
    auditor.audit_all_views()
    
    patches = auditor.generate_patches()
    
    if patches:
        print(f"\n🔧 Generated {len(patches)} patch recommendations")
        for patch in patches:
            print(f"  • {patch['description']} in {patch['file']}")

if __name__ == '__main__':
    main()
