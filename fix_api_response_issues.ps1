# Read the content of the file
$content = Get-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage.tsx' -Raw

# Fix all API response handling issues
# Pattern 1: searchUsers('') with response.data.results || response.data
$content = $content -replace 'const response = await searchUsers\(''''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers('''');'

# Pattern 2: searchUsers(query || '', 'ADVISER') with response.data.results || response.data
$content = $content -replace 'const response = await searchUsers\(query \|\| '''', ''ADVISER''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers(query || '''', ''ADVISER'');'

# Write the fixed content back to the file
Set-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage.tsx' $content