import { useEffect, useState } from 'react';
import { Upload, Grid3x3, List, Filter, Download, Eye, Share2, FileText, File, Table, Presentation } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { fetchDocuments } from '../../api/documentService';
import { Document } from '../../types';

interface DocumentManagerProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

export function DocumentManager({ userRole }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');

  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        const fetchedDocuments = await fetchDocuments();
        setDocuments(fetchedDocuments);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError('Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, []);

  const getFileIcon = (type: string) => {
    // Extract file extension from mime type or file path
    const extension = type.split('/').pop()?.split('.').pop()?.toUpperCase() || 'FILE';
    
    switch (extension) {
      case 'PDF':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'DOC':
      case 'DOCX':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'XLS':
      case 'XLSX':
        return <Table className="w-6 h-6 text-green-600" />;
      case 'PPT':
      case 'PPTX':
        return <Presentation className="w-6 h-6 text-orange-600" />;
      default:
        return <File className="w-6 h-6 text-slate-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800';
      case 'Draft':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    // Extract file extension for filtering
    const extension = doc.mime_type ? doc.mime_type.split('/').pop()?.toUpperCase() : '';
    const matchesFileType = fileTypeFilter === 'all' || extension === fileTypeFilter;
    // For permission filter, we'll skip it for now as we don't have permission data in the API response
    return matchesFileType;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
            <p className="text-slate-600">Loading documents...</p>
          </div>
        </div>
        <div>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
            <p className="text-slate-600">Error: {error}</p>
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
          <h1 className="text-3xl text-slate-900 mb-2">Document Manager</h1>
          <p className="text-slate-600">Manage research documents and files with Google Drive integration</p>
        </div>
        <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Upload Document
        </Button>
      </div>

      {/* Controls */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Select value={fileTypeFilter} onValueChange={setFileTypeFilter}>
              <SelectTrigger className="w-[140px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="DOC">Word Docs</SelectItem>
                <SelectItem value="DOCX">Word Docs (.docx)</SelectItem>
                <SelectItem value="XLS">Spreadsheets</SelectItem>
                <SelectItem value="XLSX">Spreadsheets (.xlsx)</SelectItem>
                <SelectItem value="PPT">Presentations</SelectItem>
                <SelectItem value="PPTX">Presentations (.pptx)</SelectItem>
              </SelectContent>
            </Select>

            <div className="px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600">
              {filteredDocuments.length} documents
            </div>
          </div>

          <div className="flex items-center gap-2 border border-slate-200 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-white shadow-sm' : ''}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-white shadow-sm' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-6 border-0 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center">
                  {getFileIcon(doc.mime_type || '')}
                </div>
                <Badge variant="secondary" className={getStatusColor(doc.is_latest ? 'Approved' : 'Draft')}>
                  {doc.is_latest ? 'Latest' : 'Archived'}
                </Badge>
              </div>

              <div className="mb-4">
                <h3 className="text-sm text-slate-900 mb-2 line-clamp-2">{doc.title}</h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">
                    {doc.mime_type?.split('/').pop()?.toUpperCase() || 'Unknown'} • v{doc.version}
                  </p>
                  <p className="text-xs text-slate-600">
                    {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown size'}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  {doc.google_doc_id ? 'Google Doc' : 'Local'}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-green-700 hover:text-green-800">
                  Edit
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Type
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Version
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Modified
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center">
                          {getFileIcon(doc.mime_type || '')}
                        </div>
                        <div>
                          <p className="text-sm text-slate-900">{doc.title}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {doc.mime_type?.split('/').pop()?.toUpperCase() || 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">v{doc.version}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(1)} MB` : 'Unknown'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={getStatusColor(doc.is_latest ? 'Approved' : 'Draft')}>
                        {doc.is_latest ? 'Latest' : 'Archived'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900 p-1.5">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredDocuments.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-slate-500">No documents found</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}