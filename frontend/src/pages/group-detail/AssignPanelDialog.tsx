import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { Search, ChevronDown, ChevronRight, Plus, X } from 'lucide-react';
import { searchUsers } from '../../api/userService';
import { Group, User } from '../../types/group';

interface AssignPanelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onAssignPanel: (groupId: string, panelIds: (number | string)[]) => Promise<void>;
}

export function AssignPanelDialog({ open, onOpenChange, group, onAssignPanel }: AssignPanelDialogProps) {
  const [availablePanels, setAvailablePanels] = useState<User[]>([]);
  const [selectedPanelIds, setSelectedPanelIds] = useState<string[]>([]);
  const [isPanelSelectionOpen, setIsPanelSelectionOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // States for panel search functionality
  const [panelSearchQuery, setPanelSearchQuery] = useState('');
  const [filteredPanels, setFilteredPanels] = useState<User[]>([]);
  
  // Effect to filter panels based on search query
  useEffect(() => {
    if (panelSearchQuery.trim() === '') {
      setFilteredPanels(availablePanels);
    } else {
      const query = panelSearchQuery.toLowerCase();
      const filtered = availablePanels.filter(panel => 
        panel.first_name.toLowerCase().includes(query) || 
        panel.last_name.toLowerCase().includes(query) ||
        panel.email.toLowerCase().includes(query)
      );
      setFilteredPanels(filtered);
    }
  }, [panelSearchQuery, availablePanels]);

  // Load panel members when dialog opens
  useEffect(() => {
    if (open) {
      loadPanelMembers();
      // Pre-select existing panels
      if (group?.panels) {
        const panelIds = group.panels.map(panel => panel.id);
        setSelectedPanelIds(panelIds);
      }
    } else {
      // Reset when dialog closes
      setSelectedPanelIds([]);
      setAvailablePanels([]);
    }
  }, [open, group]);

  const loadPanelMembers = async () => {
    try {
      setIsLoading(true);
      // Fetch only PANEL users
      const panels = await searchUsers('', 'PANEL');
      // Convert User objects from index.ts format to group.ts format
      const convertedPanels = panels.map(panel => ({
        id: panel.id,
        first_name: panel.first_name || '',
        last_name: panel.last_name || '',
        email: panel.email,
        role: panel.role.toUpperCase() as 'STUDENT' | 'ADVISER' | 'PANEL' | 'ADMIN',
        is_active: panel.is_active ?? true,
        is_staff: panel.is_staff ?? false,
        assigned_groups_count: panel.assigned_groups_count ?? 0
      }));
      setAvailablePanels(convertedPanels);
    } catch (error) {
      console.error('Error loading panel members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!group || selectedPanelIds.length === 0) {
      alert('Please select at least one panel member.');
      return;
    }

    try {
      // Send the panel IDs as they are (strings or numbers)
      // The backend can handle both string UUIDs and integer IDs
      const panelIds = Array.isArray(selectedPanelIds) ? selectedPanelIds.map(id => {
        // If it's a numeric string, convert to number; otherwise keep as string
        if (typeof id === 'string' && /^\d+$/.test(id)) {
          return parseInt(id, 10);
        }
        return id;
      }).filter(id => id !== null && id !== undefined && id !== '') : [];
      
      if (panelIds.length === 0) {
        alert('No valid panel members selected.');
        return;
      }
      
      await onAssignPanel(group.id, panelIds);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error assigning panels:', error);
      // Check if it's a permission error
      if (error.response?.status === 403) {
        alert('You do not have permission to assign panel members. Only administrators or the group adviser can perform this action.');
      } else {
        alert('Failed to assign panel members. Please try again.');
      }
    }
  };

  const togglePanelSelection = (panelId: string) => {
    setSelectedPanelIds(prev => {
      // Ensure prev is an array before using includes and filter
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.includes(panelId) 
        ? prevArray.filter(id => id !== panelId) 
        : [...prevArray, panelId];
    });
  };

  const removeSelectedPanel = (panelId: string) => {
    setSelectedPanelIds(prev => {
      // Ensure prev is an array before filtering
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter(id => id !== panelId);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Assign Panel Members to Group</DialogTitle>
          <DialogDescription>
            Select panel members to assign to this group. Panel members will be able to review and evaluate the group's thesis work.
          </DialogDescription>
        </DialogHeader>
        
        {/* Scrollable form container - scrollbar always visible */}
        <div style={{ 
          maxHeight: '60vh', 
          overflowY: 'scroll',
          paddingRight: '0.5rem'
        }}>
          <div className="grid gap-4 py-4">
            {group && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Group</Label>
                <div className="col-span-3">
                  <div className="font-medium">{group.name}</div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">
                Select Panel Members *
              </Label>
              <div className="col-span-3">
                <div className="space-y-2">
                  {/* Collapsible header for panel selection */}
                  <div 
                    className="flex items-center justify-between p-3 border rounded-md cursor-pointer bg-slate-50 hover:bg-slate-100"
                    onClick={() => setIsPanelSelectionOpen(!isPanelSelectionOpen)}
                  >
                    <div className="flex items-center gap-2">
                      {isPanelSelectionOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Select Panel Members</span>
                    </div>
                    {selectedPanelIds.length > 0 && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 border h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPanelIds([]);
                        }}
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                  
                  {/* Collapsible panel selection content */}
                  {isPanelSelectionOpen && (
                    <div className="border rounded-md">
                      {/* Search input for panels */}
                      <div className="p-3 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search panel members by name or email..."
                            value={panelSearchQuery}
                            onChange={(e) => setPanelSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      
                      {/* Panel list with search results */}
                      <div className="max-h-40 overflow-y-auto">
                        {isLoading ? (
                          <div className="p-2 text-slate-500">Loading panel members...</div>
                        ) : filteredPanels.length > 0 ? (
                          filteredPanels.map((panel) => (
                            <div 
                              key={panel.id} 
                              className={`flex items-center gap-2 p-2 hover:bg-slate-100 rounded cursor-pointer ${
                                selectedPanelIds.includes(panel.id) ? 'bg-purple-50 border border-purple-200' : ''
                              }`}
                              onClick={() => togglePanelSelection(panel.id)}
                            >
                              <input
                                type="checkbox"
                                checked={selectedPanelIds.includes(panel.id)}
                                onChange={() => {}}
                                className="cursor-pointer"
                              />
                              <div>
                                <div className="font-medium">{panel.first_name} {panel.last_name}</div>
                                <div className="text-sm text-slate-500">{panel.email}</div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-2 text-slate-500 text-center">
                            {panelSearchQuery ? 'No panel members found matching your search' : 'No panel members available'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Always visible selected panels display */}
                  {selectedPanelIds.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-slate-600 mb-1">Selected panel members:</p>
                      <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1">
                        {selectedPanelIds.map(panelId => {
                          const panel = availablePanels.find(p => p.id === panelId);
                          return panel ? (
                            <div 
                              key={panelId} 
                              className="flex items-center gap-1 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                            >
                              {panel.first_name} {panel.last_name}
                              <button 
                                type="button" 
                                onClick={() => removeSelectedPanel(panelId)}
                                className="text-purple-800 hover:text-purple-900 ml-1"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* End scrollable form container */}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={selectedPanelIds.length === 0}>
            Assign Panel Members
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}