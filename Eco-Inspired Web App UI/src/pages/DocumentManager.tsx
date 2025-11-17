import { useState } from 'react';
import { Upload, Grid3x3, List, Filter, Download, Eye, Share2, FileText, File, Table, Presentation } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

interface DocumentManagerProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

const mockDocuments = [
  {
    id: '1',
    name: 'Thesis Proposal - Climate Change Study',
    type: 'PDF',
    version: 'v2.1',
    owner: 'John Smith',
    group: 'Rainforest Biodiversity Team',
    lastModified: '2 hours ago',
    size: '2.4 MB',
    permissions: 'Group Shared',
    status: 'Approved',
  },
  {
    id: '2',
    name: 'Chapter 1: Introduction',
    type: 'DOCX',
    version: 'v1.3',
    owner: 'Maria Garcia',
    group: 'Rainforest Biodiversity Team',
    lastModified: '5 hours ago',
    size: '856 KB',
    permissions: 'Adviser Only',
    status: 'Under Review',
  },
  {
    id: '3',
    name: 'Research Data Analysis Q4 2024',
    type: 'XLSX',
    version: 'v1.0',
    owner: 'David Chen',
    group: 'Marine Conservation Team',
    lastModified: '1 day ago',
    size: '4.2 MB',
    permissions: 'Group Shared',
    status: 'Draft',
  },
  {
    id: '4',
    name: 'Literature Review Compilation',
    type: 'DOCX',
    version: 'v2.0',
    owner: 'Sarah Johnson',
    group: 'Urban Ecology Group',
    lastModified: '2 days ago',
    size: '1.8 MB',
    permissions: 'Group Shared',
    status: 'Approved',
  },
  {
    id: '5',
    name: 'Field Research Presentation',
    type: 'PPTX',
    version: 'v1.1',
    owner: 'Emily Wong',
    group: 'Marine Conservation Team',
    lastModified: '3 days ago',
    size: '12.5 MB',
    permissions: 'Group Shared',
    status: 'Draft',
  },
  {
    id: '6',
    name: 'Methodology Documentation',
    type: 'PDF',
    version: 'v1.5',
    owner: 'Robert Lee',
    group: 'Sustainable Energy Group',
    lastModified: '4 days ago',
    size: '3.1 MB',
    permissions: 'Adviser Only',
    status: 'Under Review',
  },
];

export function DocumentManager({ userRole }: DocumentManagerProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [fileTypeFilter, setFileTypeFilter] = useState('all');
  const [permissionFilter, setPermissionFilter] = useState('all');

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'PDF':
        return <FileText className="w-6 h-6 text-red-600" />;
      case 'DOCX':
        return <FileText className="w-6 h-6 text-blue-600" />;
      case 'XLSX':
        return <Table className="w-6 h-6 text-green-600" />;
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

  const filteredDocuments = mockDocuments.filter((doc) => {
    const matchesFileType = fileTypeFilter === 'all' || doc.type === fileTypeFilter;
    const matchesPermission = permissionFilter === 'all' || doc.permissions === permissionFilter;
    return matchesFileType && matchesPermission;
  });

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
                <SelectItem value="DOCX">Word Docs</SelectItem>
                <SelectItem value="XLSX">Spreadsheets</SelectItem>
                <SelectItem value="PPTX">Presentations</SelectItem>
              </SelectContent>
            </Select>

            <Select value={permissionFilter} onValueChange={setPermissionFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Permissions</SelectItem>
                <SelectItem value="Group Shared">Group Shared</SelectItem>
                <SelectItem value="Adviser Only">Adviser Only</SelectItem>
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
                  {getFileIcon(doc.type)}
                </div>
                <Badge variant="secondary" className={getStatusColor(doc.status)}>
                  {doc.status}
                </Badge>
              </div>

              <div className="mb-4">
                <h3 className="text-sm text-slate-900 mb-2 line-clamp-2">{doc.name}</h3>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">
                    {doc.type} • {doc.version}
                  </p>
                  <p className="text-xs text-slate-600">{doc.size}</p>
                  <p className="text-xs text-slate-500">{doc.owner}</p>
                </div>
              </div>

              <div className="mb-4">
                <Badge variant="outline" className="text-xs">
                  {doc.permissions}
                </Badge>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <span className="text-xs text-slate-500">{doc.lastModified}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Eye className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="w-4 h-4 text-slate-600" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="w-4 h-4 text-slate-600" />
                  </Button>
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full mt-3 text-xs"
                size="sm"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"
                  />
                </svg>
                Open in Google Docs
              </Button>
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
                    Owner
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Permissions
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                    Modified
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
                        {getFileIcon(doc.type)}
                        <div>
                          <p className="text-sm text-slate-900">{doc.name}</p>
                          <p className="text-xs text-slate-500">{doc.size}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{doc.type}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{doc.version}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{doc.owner}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-xs">
                        {doc.permissions}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={getStatusColor(doc.status)}>
                        {doc.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-600">{doc.lastModified}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {filteredDocuments.length === 0 && (
        <Card className="p-12 border-0 shadow-sm">
          <div className="text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No documents found matching your criteria</p>
          </div>
        </Card>
      )}
    </div>
  );
}
