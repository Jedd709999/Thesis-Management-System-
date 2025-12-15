import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Download, FileText, Calendar, User, Archive as ArchiveIcon, Loader2, FolderOpen, Search } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { searchArchives } from '../../api/archiveService';
import { ArchiveRecord } from '../../types';

// Define the specific data structure for thesis archive records
interface ThesisArchiveData {
  title: string;
  abstract?: string;
  keywords?: string[];
  group_name?: string;
  adviser_name?: string;
  panels?: string[];
  topic?: string;
  finished_at?: string;
  drive_folder_url?: string;
  [key: string]: any; // Allow additional properties
}

const ArchivePage = () => {
  const { user } = useAuth();
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [downloading, setDownloading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const userRole = user?.role?.toLowerCase();

  useEffect(() => {
    loadArchives();
  }, []);

  // Set default year to current year
  useEffect(() => {
    setSelectedYear('all');
  }, []);

  // Auto-search when searchQuery or selectedYear changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery || selectedYear !== 'all') {
        handleSearch();
      } else {
        loadArchives();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, selectedYear]);

  const loadArchives = async () => {
    try {
      setLoading(true);
      const response = await api.get('archives/thesis_archives/');
      setArchives(response.data);
    } catch (error) {
      console.error('Failed to load archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const results = await searchArchives(searchQuery, selectedYear);
      setArchives(results);
    } catch (error) {
      console.error('Failed to search archives:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedYear('all');
    loadArchives();
  };

  const handleDownloadReport = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmYes = () => {
    setShowConfirmDialog(false);
    setShowDownloadModal(true);
  };

  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  const getAvailableYears = () => {
    const currentYear = getCurrentYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  };

  const confirmDownload = async () => {
    try {
      setDownloading(true);
      const format = selectedFormat;
      const year = selectedYear;

      // Create a temporary link to trigger download
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
      const downloadUrl = `${baseUrl}/archives/download_report/`;
      
      // Get the access token
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(downloadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          year: year,
          format: format
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Set appropriate filename based on format
      let extension = 'pdf';
      if (format === 'xlsx') extension = 'xlsx';
      else if (format === 'doc') extension = 'doc';
      
      link.download = `thesis_archive_${year}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setShowDownloadModal(false);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download archive report');
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredArchives = archives.filter(archive => {
    const archiveYear = new Date(archive.archived_at).getFullYear().toString();
    return selectedYear === 'all' || archiveYear === selectedYear;
  });

  // Type guard to check if archive data has the required properties
  const isThesisArchiveData = (data: any): data is ThesisArchiveData => {
    return data && typeof data === 'object' && 'title' in data;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Archive Management</h1>
          <p className="text-gray-600 mt-1">View and export archived thesis records</p>
        </div>
        {userRole === 'admin' && (
          <Button 
            onClick={handleDownloadReport}
            className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Archive Report
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, abstract, or keywords..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Year
            </label>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger>
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {getAvailableYears().map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button variant="outline" onClick={handleResetFilters}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Archive Records Table */}
      <Card className="border-0 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thesis Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Abstract
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Keywords
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Group
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Adviser
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Panel Members
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archived Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    <p className="mt-2 text-gray-500">Loading archives...</p>
                  </td>
                </tr>
              ) : Array.isArray(filteredArchives) && filteredArchives.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No archived theses found
                  </td>
                </tr>
              ) : (
                filteredArchives.map((archive) => (
                  <tr key={archive.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <FileText className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {isThesisArchiveData(archive.data) ? archive.data.title : 'Untitled'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900 max-w-md truncate">
                        {isThesisArchiveData(archive.data) ? (archive.data.abstract || 'No abstract provided') : 'No abstract provided'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {isThesisArchiveData(archive.data) && archive.data.keywords && Array.isArray(archive.data.keywords) && archive.data.keywords.length > 0 ? (
                          archive.data.keywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {keyword}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">No keywords</span>
                        )}
                      </div>

                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {isThesisArchiveData(archive.data) ? (archive.data.group_name || 'No group assigned') : 'No group assigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-900">
                        {isThesisArchiveData(archive.data) ? (archive.data.adviser_name || 'No adviser assigned') : 'No adviser assigned'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {isThesisArchiveData(archive.data) && archive.data.panels && Array.isArray(archive.data.panels) && archive.data.panels.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {archive.data.panels.slice(0, 2).map((panel, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {panel}
                            </Badge>
                          ))}
                          {Array.isArray(archive.data.panels) && archive.data.panels.length > 2 && (
                            <Badge variant="secondary" className="text-xs">
                              +{archive.data.panels.length - 2} more
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No panel assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                        <p className="text-sm text-gray-900">
                          {formatDate(archive.archived_at)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isThesisArchiveData(archive.data) && archive.data.drive_folder_url && (
                        <a 
                          href={archive.data.drive_folder_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Open Folder
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Archive Report Export</DialogTitle>
            <DialogDescription>
              Are you sure you want to export the archive report? This will generate a downloadable file containing all archived thesis records.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmYes}>
              Yes, Export Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Download Modal */}
      <Dialog open={showDownloadModal} onOpenChange={setShowDownloadModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Archive Report</DialogTitle>
            <DialogDescription>
              Select the format and year for your archive report export.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  {/* Only show Excel option to admin users */}
                  {userRole === 'admin' && (
                    <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  )}
                  <SelectItem value="doc">Word (.doc)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Year
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {getAvailableYears().map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowDownloadModal(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDownload} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export Report'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ArchivePage;