# Remove duplicate comment in ThesisManagementPage.tsx
with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove the duplicate comment
search_text = "{/* Panel Action Buttons - Check if user is a panel member and thesis has scheduled defense */}\n                      {/*\n Panel Action Buttons */}"
replace_text = "{/* Panel Action Buttons - Check if user is a panel member and thesis has scheduled defense */}"

fixed_content = content.replace(search_text, replace_text)

with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'w', encoding='utf-8') as f:
    f.write(fixed_content)

print('Removed duplicate comment')