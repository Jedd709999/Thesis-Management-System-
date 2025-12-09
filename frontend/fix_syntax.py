# Fix syntax error in ThesisManagementPage.tsx
with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the syntax error by replacing })()} with )}
fixed_content = content[:21495] + ')}' + content[21500:]

with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print("Syntax error fixed!")