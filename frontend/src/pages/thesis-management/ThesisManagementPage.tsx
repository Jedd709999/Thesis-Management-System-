import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, MoreVertical, Download } from 'lucide-react';
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
import { fetchTheses } from '../../api/thesisService';
import { Thesis } from '../../types';

interface ThesisManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onViewDetail: (thesisId: string) => void;
}

export function ThesisManagement({ userRole, onViewDetail }: ThesisManagementProps) {
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adviserFilter, setAdviserFilter] = useState('all');

  useEffect(() => {
    const loadTheses = async () => {
      try {
        setLoading(true);
        const fetchedTheses = await fetchTheses();
        setTheses(fetchedTheses);
        setError(null);
      } catch (err) {
        console.error('Error fetching theses:', err);
        setError('Failed to load theses');
      } finally {
        setLoading(false);
      }
    };

    loadTheses();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Submitted':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const filteredTheses = theses.filter((thesis) => {
    const matchesSearch = searchQuery === '' || 
                         thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (thesis.group && typeof thesis.group !== 'string' && thesis.group.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || thesis.status === statusFilter;
    // For adviser filter, we would need to check the adviser's name, but for now we'll skip this filter
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
            <p className="text-slate-600">Loading theses...</p>
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
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
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
          <h1 className="text-3xl text-slate-900 mb-2">Thesis Management</h1>
          <p className="text-slate-600">Manage and track environmental science research projects</p>
        </div>
        {(userRole === 'student' || userRole === 'admin') && (
          <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Thesis
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="p-6 border-0 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by thesis title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SUBMITTED">Submitted</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Thesis Table */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Thesis Title
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Group
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Last Updated
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTheses.map((thesis) => (
                <tr key={thesis.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-900 max-w-md">{thesis.title}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {thesis.group ? (typeof thesis.group === 'string' ? thesis.group : thesis.group.name) : 'No Group'}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`border ${getStatusColor(thesis.status.replace('_', ' '))}`}>
                      {thesis.status.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">
                      {new Date(thesis.updated_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(thesis.id)}
                        className="text-green-700 hover:text-green-800 hover:bg-green-50"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {(userRole === 'student' || userRole === 'admin') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-600 hover:text-slate-900"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-slate-600 hover:text-slate-900"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTheses.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-slate-500">No theses found matching your criteria</p>
          </div>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map((status) => {
          const count = theses.filter((t) => t.status === status).length;
          return (
            <Card key={status} className="p-4 border-0 shadow-sm">
              <p className="text-sm text-slate-600 mb-1">{status.replace('_', ' ')}</p>
              <p className="text-2xl text-slate-900">{count}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}