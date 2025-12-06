import React, { useState, useEffect } from 'react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Download, FileText, Calendar, User, Archive as ArchiveIcon, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';

interface ArchiveRecord {
  id: string;
  content_type: string;
  data: {
    title: string;
    abstract?: string;
    group_name?: string;
    topic?: string;
    finished_at?: string;
    panels?: string[];
  };
  archived_at: string;
  archived_by_detail: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

const ArchivePage = () => {
  const { user } = useAuth();
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>('2025');
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
    setSelectedYear(getCurrentYear().toString());
  }, []);

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

  const handleDownloadReport = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmYes = () => {
    setShowConfirmDialog(false);
    setShowDownloadModal(true);
    confirmDownload();
  };

  const confirmDownload = async () => {
    try {
      setDownloading(true);
      const response = await fetch(`${window.location.protocol}//${window.location.hostname}:8000/api/archives/download_report/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          year: selectedYear,
          format: selectedFormat
        }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const extension = selectedFormat === 'excel' ? 'xlsx' : selectedFormat === 'doc' ? 'doc' : 'pdf';
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `thesis_report_${selectedYear}.${extension}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        // Download successful
      } else {
        // Debug: Log response details
        console.error('Download failed - Response status:', response.status);
        console.error('Download failed - Response headers:', Object.fromEntries(response.headers.entries()));

        // Try to get error message from response
        let errorMessage = 'Failed to download report. Please try again.';
        try {
          const responseText = await response.text();
          console.error('Download failed - Raw response:', responseText);

          // Try to parse as JSON
          const errorData = JSON.parse(responseText);
          if (errorData.detail) {
            errorMessage = errorData.detail;
          }
        } catch (e) {
          // If we can't parse the error response, use the generic message
          console.error('Failed to parse error response:', e);
          errorMessage = `Download failed (Status: ${response.status}). Please check console for details.`;
        }
        console.error('Final error message:', errorMessage);
        alert(errorMessage);
        // Download successful
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Error downloading report. Please try again.');
      setShowConfirmDialog(false);
    } finally {
      setDownloading(false);
      // Keep modal visible for at least 1 second for better UX
      setTimeout(() => {
        setShowDownloadModal(false);
      }, 1000);
    }
  };

  const getCurrentYear = () => new Date().getFullYear();
  const getYears = () => {
    const currentYear = getCurrentYear();
    const years = [];
    // Go back 30 years to accommodate extensive historical archives
    for (let i = currentYear; i >= currentYear - 30; i--) {
      years.push(i.toString());
    }
    return years;
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <ArchiveIcon className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
            <p className="text-lg text-gray-600">Loading archives...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Archive</h1>
          <p className="text-slate-600 flex items-center gap-2">
            <ArchiveIcon className="w-4 h-4 text-green-600" />
            View archived theses and download reports
          </p>
        </div>

        {/* Download Report Section - Only for admin and adviser */}
        {(userRole === 'admin' || userRole === 'adviser') && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Select Year:</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getYears().map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Format:</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                  <SelectItem value="doc">Word (DOC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleDownloadReport}
              disabled={downloading || showDownloadModal}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          </div>
        )}
      </div>

      {/* Archive Records */}
      <div className="grid gap-4">
        {archives.length > 0 ? (
          archives.map((archive) => (
            <Card key={archive.id} className="p-6 border-0 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-slate-900">
                      {archive.data.title || 'Untitled Thesis'}
                    </h3>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {archive.content_type}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Group:</strong> {archive.data.group_name || 'Unknown Group'}
                  </p>

                  <p className="text-sm text-slate-600 mb-2">
                    <strong>Topic:</strong> {archive.data.title || 'Unknown Topic'}
                  </p>

                  {archive.data.abstract && (
                    <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                      <strong>Abstract:</strong> {archive.data.abstract}
                    </p>
                  )}

                  {archive.data.panels && archive.data.panels.length > 0 && (
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-slate-600">
                        <strong>Panel:</strong> {archive.data.panels.join(', ')}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>Archived: {new Date(archive.archived_at).toLocaleDateString()}</span>
                    </div>
                    {archive.data.finished_at && (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Finished: {new Date(archive.data.finished_at).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>By: {archive.archived_by_detail.first_name} {archive.archived_by_detail.last_name}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <ArchiveIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No archived records</h3>
            <p className="text-gray-500">There are no archived theses to display.</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[320px] sm:max-h-[240px] p-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4 h-full">
            <div className="p-3 bg-green-100 rounded-full">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-gray-900">
                Download Report
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Are you sure you want to download the thesis report for <span className="font-medium text-gray-900">{selectedYear}</span>?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={downloading || showDownloadModal}
                size="sm"
                className="px-4"
              >
                No
              </Button>
              <Button
                onClick={handleConfirmYes}
                disabled={downloading || showDownloadModal}
                size="sm"
                className="px-4 bg-green-600 hover:bg-green-700 text-white"
              >
                Yes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Download Loading Modal */}
      <Dialog open={showDownloadModal} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-[400px] p-6 z-50">
          <div className="flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Download className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">Downloading Report</h3>
              <p className="text-sm text-gray-600">
                Preparing your thesis report for {selectedYear} in {selectedFormat.toUpperCase()} format...
              </p>
              <p className="text-xs text-gray-500">
                This may take a few moments. Please wait...
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ArchivePage;
