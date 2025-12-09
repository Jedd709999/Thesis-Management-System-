import { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Download, FileText, Users, User, Tag } from 'lucide-react';
import { fetchTheses } from '../../api/thesisService';
import { Thesis } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import * as XLSX from 'xlsx';

export function ArchivePage() {
  const { user } = useAuth();
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [filteredTheses, setFilteredTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  useEffect(() => {
    const loadArchivedTheses = async () => {
      try {
        setLoading(true);
        // Fetch only archived theses
        const fetchedTheses = await fetchTheses('ARCHIVED');
        setTheses(fetchedTheses);
        
        // Extract unique years from thesis updated_at dates
        const years = Array.from(
          new Set(
            fetchedTheses
              .map(thesis => new Date(thesis.updated_at).getFullYear())
              .filter(year => !isNaN(year))
          )
        ).sort((a, b) => b - a);
        
        setAvailableYears(years);
      } catch (error) {
        console.error('Error fetching archived theses:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArchivedTheses();
  }, []);

  useEffect(() => {
    // Filter theses by selected year
    if (selectedYear === 'all') {
      setFilteredTheses(theses);
    } else {
      const year = parseInt(selectedYear);
      const filtered = theses.filter(thesis => {
        const thesisYear = new Date(thesis.updated_at).getFullYear();
        return thesisYear === year;
      });
      setFilteredTheses(filtered);
    }
  }, [selectedYear, theses]);

  const handleDownloadReport = () => {
    // Prepare data for Excel export (enhanced with more fields)
    const dataToExport = filteredTheses.map(thesis => {
      // Handle group being either string or Group object
      const group = typeof thesis.group === 'string' ? null : thesis.group;
      
      return {
        'Thesis Title': thesis.title,
        'Abstract': thesis.abstract,
        'Group': group?.name || 'N/A',
        'Adviser': group?.adviser?.first_name && group?.adviser?.last_name 
          ? `${group.adviser.first_name} ${group.adviser.last_name}` 
          : 'N/A',
        'Panel Members': group?.panels?.map(panelist => 
          `${panelist.first_name} ${panelist.last_name}`).join(', ') || 'N/A',
        'Keywords': thesis.keywords ? thesis.keywords.split(',').map(k => k.trim()) : []
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thesis Archives');
    
    // Generate filename with timestamp
    const fileName = `thesis_archives_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Export to file
    XLSX.writeFile(wb, fileName);
  };

  // Helper function to get adviser name from group
  const getAdviserName = (thesis: Thesis) => {
    if (typeof thesis.group === 'string') return 'Not assigned';
    
    const adviser = thesis.group?.adviser;
    if (adviser?.first_name && adviser?.last_name) {
      return `${adviser.first_name} ${adviser.last_name}`;
    }
    return 'Not assigned';
  };

  // Helper function to get panel members names from group
  const getPanelMembersNames = (thesis: Thesis) => {
    if (typeof thesis.group === 'string') return 'Not assigned';
    
    const panels = thesis.group?.panels;
    if (panels && panels.length > 0) {
      return panels.map(panelist => 
        `${panelist.first_name} ${panelist.last_name}`).join(', ');
    }
    return 'Not assigned';
  };

  // Helper function to get group name
  const getGroupName = (thesis: Thesis) => {
    if (typeof thesis.group === 'string') return 'No group assigned';
    return thesis.group?.name || 'No group assigned';
  };

  // Helper function to get keywords as array
  const getKeywordsArray = (keywords: string) => {
    if (!keywords) return [];
    return keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Archives</h1>
            <p className="text-slate-600">View archived theses and download reports</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Thesis Archives</h1>
          <p className="text-slate-600">View archived theses and download reports</p>
        </div>
        {user?.role === 'ADMIN' && (
          <Button 
            className="bg-green-700 hover:bg-green-800 flex items-center gap-2"
            onClick={handleDownloadReport}
            disabled={filteredTheses.length === 0}
          >
            <Download className="w-4 h-4" />
            Download Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="w-full sm:w-64">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Academic Year
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}-{year + 1}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Archive List - Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTheses.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-12">
            <FileText className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">No archived theses found</h3>
            <p className="text-slate-500">Try adjusting your filters to see more results</p>
          </div>
        ) : (
          filteredTheses.map((thesis) => (
            <Card key={thesis.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{thesis.title}</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Archived on {new Date(thesis.updated_at).toLocaleDateString()}
                  </p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-1">Abstract</h4>
                  <p className="text-sm text-slate-600 line-clamp-3">
                    {thesis.abstract || 'No abstract available'}
                  </p>
                </div>
                
                <div className="flex items-center text-sm text-slate-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span>{getGroupName(thesis)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-slate-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>
                      Adviser: {getAdviserName(thesis)}
                    </span>
                  </div>
                  
                  <div className="flex items-start text-sm text-slate-600">
                    <User className="w-4 h-4 mr-2 mt-0.5" />
                    <div>
                      <span className="block">Panel:</span>
                      <span className="block">
                        {getPanelMembersNames(thesis)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {getKeywordsArray(thesis.keywords).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-700 mb-1 flex items-center">
                      <Tag className="w-4 h-4 mr-1" />
                      Keywords
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {getKeywordsArray(thesis.keywords).map((keyword, index) => (
                        <span 
                          key={index} 
                          className="inline-block bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}