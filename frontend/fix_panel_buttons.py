# Fix panel action buttons section in ThesisManagementPage.tsx
with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start and end positions of the problematic section
start_pos = content.find('{userRole?.toUpperCase() === \'PANEL\'')
end_pos = content.find('})()}')

if start_pos != -1 and end_pos != -1:
    # Replace the problematic section with clean JSX
    replacement = '''{/*
 Panel Action Buttons */}
                      {userRole?.toUpperCase() === 'PANEL' && isPanelMemberForThesis(thesis) && isThesisScheduledForDefense(thesis) && tabType === 'my' && !panelActionsLoading && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'approve')}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50 p-2"
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Approve Thesis</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'request_revision')}
                                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 p-2"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Request Revisions</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handlePanelAction(thesis, 'reject')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Reject Thesis</p>
                            </TooltipContent>
                          </Tooltip>
                        </>
                      )}
                      {/* Loading indicator for panel actions */}
                      {userRole?.toUpperCase() === 'PANEL' && isPanelMemberForThesis(thesis) && isThesisScheduledForDefense(thesis) && tabType === 'my' && panelActionsLoading && (
                        <span className="text-sm text-slate-500">
                          Loading...
                        </span>
                      )}'''
    
    fixed_content = content[:start_pos] + replacement + content[end_pos+6:]
    
    with open('src/pages/thesis-management/ThesisManagementPage.tsx', 'w', encoding='utf-8') as f:
        f.write(fixed_content)
    
    print('Fixed panel action buttons section')
else:
    print('Could not find the problematic section')