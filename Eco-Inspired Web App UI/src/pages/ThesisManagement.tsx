import { useState } from 'react';
import { Search, Filter, Plus, Eye, Edit, MoreVertical, Download } from 'lucide-react';
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

interface ThesisManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
  onViewDetail: (thesisId: string) => void;
}

const mockTheses = [
  {
    id: '1',
    title: 'Impact of Climate Change on Rainforest Biodiversity in Southeast Asia',
    group: 'Rainforest Biodiversity Team',
    adviser: 'Dr. Maria Santos',
    status: 'Under Review',
    lastUpdated: '2 hours ago',
    progress: 65,
  },
  {
    id: '2',
    title: 'Sustainable Waste Management Practices in Urban Communities',
    group: 'Urban Ecology Group',
    adviser: 'Dr. James Wilson',
    status: 'Approved',
    lastUpdated: '1 day ago',
    progress: 100,
  },
  {
    id: '3',
    title: 'Marine Microplastic Pollution and Ecosystem Health',
    group: 'Marine Conservation Team',
    adviser: 'Dr. Elena Rodriguez',
    status: 'Draft',
    lastUpdated: '3 days ago',
    progress: 30,
  },
  {
    id: '4',
    title: 'Renewable Energy Adoption in Rural Agricultural Communities',
    group: 'Sustainable Energy Group',
    adviser: 'Dr. Michael Chen',
    status: 'Submitted',
    lastUpdated: '5 hours ago',
    progress: 85,
  },
  {
    id: '5',
    title: 'Soil Erosion Prevention Through Native Plant Restoration',
    group: 'Soil Conservation Team',
    adviser: 'Dr. Sarah Johnson',
    status: 'Rejected',
    lastUpdated: '2 days ago',
    progress: 45,
  },
  {
    id: '6',
    title: 'Water Quality Assessment in Coastal Ecosystems',
    group: 'Coastal Ecology Group',
    adviser: 'Dr. David Park',
    status: 'Under Review',
    lastUpdated: '6 hours ago',
    progress: 70,
  },
];

export function ThesisManagement({ userRole, onViewDetail }: ThesisManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adviserFilter, setAdviserFilter] = useState('all');

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

  const filteredTheses = mockTheses.filter((thesis) => {
    const matchesSearch = thesis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         thesis.group.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || thesis.status === statusFilter;
    const matchesAdviser = adviserFilter === 'all' || thesis.adviser === adviserFilter;
    return matchesSearch && matchesStatus && matchesAdviser;
  });

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
              placeholder="Search by thesis title or group name..."
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
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Submitted">Submitted</SelectItem>
                <SelectItem value="Under Review">Under Review</SelectItem>
                <SelectItem value="Approved">Approved</SelectItem>
                <SelectItem value="Rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={adviserFilter} onValueChange={setAdviserFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Adviser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Advisers</SelectItem>
                <SelectItem value="Dr. Maria Santos">Dr. Maria Santos</SelectItem>
                <SelectItem value="Dr. James Wilson">Dr. James Wilson</SelectItem>
                <SelectItem value="Dr. Elena Rodriguez">Dr. Elena Rodriguez</SelectItem>
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
                  Adviser
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">
                  Progress
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
                    <p className="text-sm text-slate-600">{thesis.group}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{thesis.adviser}</p>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`border ${getStatusColor(thesis.status)}`}>
                      {thesis.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden max-w-[100px]">
                        <div
                          className="h-full bg-green-600 rounded-full"
                          style={{ width: `${thesis.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-600">{thesis.progress}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-600">{thesis.lastUpdated}</p>
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
        {['Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'].map((status) => {
          const count = mockTheses.filter((t) => t.status === status).length;
          return (
            <Card key={status} className="p-4 border-0 shadow-sm">
              <p className="text-sm text-slate-600 mb-1">{status}</p>
              <p className="text-2xl text-slate-900">{count}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
