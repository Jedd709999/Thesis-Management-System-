# Read the content of the file
$content = Get-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage.tsx'

# Fix all API response handling issues
# Pattern 1: searchUsers('') 
$content = $content -replace 'const response = await searchUsers\(''''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers('''');'

# Pattern 2: searchUsers(query || '', 'ADVISER')
$content = $content -replace 'const response = await searchUsers\(query \|\| '''', ''ADVISER''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers(query || '''', ''ADVISER'');'

# Pattern 3: searchUsers('') (second occurrence)
$content = $content -replace 'const response = await searchUsers\(''''\);\s+const users = response\.data\.results \|\| response\.data;', 'const users = await searchUsers('''');'

# Fix User icon naming conflict
$content = $content -replace '<User className="w-4 h-4 mr-2" />', '<UserIcon className="w-4 h-4 mr-2" />'

# Write the fixed content back to the file
$content | Set-Content 'c:\Thesis Management System\frontend\src\pages\group-management\GroupManagementPage.tsx'