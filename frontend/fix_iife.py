# Fix IIFE in ThesisManagementPage.tsx
with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end positions of the IIFE
start_pos = content.find('{(() => {')
end_pos = content.find('                      })}') + len('                      })}')

if start_pos != -1 and end_pos != -1:
    # Extract the IIFE content
    iife_content = content[start_pos:end_pos]
    
    # Replace with clean JSX
    replacement = '''{canViewThesis(thesis) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => onViewDetail(thesis.id)}
                              className="text-green-700 hover:text-green-800 hover:bg-green-50 p-2"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>View Details</p>
                          </TooltipContent>
                        </Tooltip>
                      )}'''
    
    fixed_content = content[:start_pos] + replacement + content[end_pos:]
    
    with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print('Fixed IIFE')
else:
    print('Could not find the IIFE')