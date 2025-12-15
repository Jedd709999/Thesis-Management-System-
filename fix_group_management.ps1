$content = Get-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage_final.tsx'

# Fix pattern 1: searchUsers('')
$content = $content -replace 'const response = await searchUsers\(''''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers('''');'

# Fix pattern 2: searchUsers(query || '', 'ADVISER')
$content = $content -replace 'const response = await searchUsers\(query \|\| '''', ''ADVISER''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers(query || '''', ''ADVISER'');'

# Write the fixed content to the final file
$content | Set-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage_final.tsx'