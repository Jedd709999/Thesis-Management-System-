import { ArrowLeft, Users, FileText, Calendar, CheckCircle, Clock, Edit, Upload, Send } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

interface ThesisDetailProps {
  thesisId: string | null;
  onBack: () => void;
}

export function ThesisDetail({ thesisId, onBack }: ThesisDetailProps) {
  const thesis = {
    id: thesisId,
    title: 'Impact of Climate Change on Rainforest Biodiversity in Southeast Asia',
    status: 'Under Review',
    abstract: 'This research investigates the effects of climate change on biodiversity patterns in Southeast Asian rainforests. Through comprehensive field studies and data analysis spanning three years, we examine species distribution shifts, population dynamics, and ecosystem resilience. Our findings reveal significant correlations between temperature variations and species migration patterns, with particular emphasis on endemic species vulnerability. The study provides crucial insights for conservation strategies and policy recommendations for sustainable forest management in the face of global climate change.',
    group: {
      name: 'Rainforest Biodiversity Team',
      members: [
        { name: 'John Smith', role: 'Lead Researcher', avatar: 'JS' },
        { name: 'Maria Garcia', role: 'Data Analyst', avatar: 'MG' },
        { name: 'David Chen', role: 'Field Researcher', avatar: 'DC' },
        { name: 'Sarah Johnson', role: 'Documentation', avatar: 'SJ' },
      ],
    },
    adviser: { name: 'Dr. Maria Santos', email: 'msantos@university.edu' },
    panel: [
      { name: 'Dr. James Wilson', specialization: 'Climate Science' },
      { name: 'Dr. Elena Rodriguez', specialization: 'Biodiversity' },
    ],
    documents: [
      { name: 'Thesis Proposal', version: 'v2.1', date: '2024-11-10', status: 'Approved', type: 'PDF' },
      { name: 'Chapter 1: Introduction', version: 'v1.3', date: '2024-11-12', status: 'Under Review', type: 'DOCX' },
      { name: 'Chapter 2: Literature Review', version: 'v1.1', date: '2024-11-13', status: 'Draft', type: 'DOCX' },
      { name: 'Research Data Analysis', version: 'v1.0', date: '2024-11-14', status: 'Draft', type: 'XLSX' },
    ],
    timeline: [
      { status: 'Proposal Submitted', date: 'Oct 15, 2024', completed: true },
      { status: 'Proposal Approved', date: 'Oct 20, 2024', completed: true },
      { status: 'Data Collection', date: 'Nov 1-30, 2024', completed: true },
      { status: 'Chapter Review', date: 'Ongoing', completed: false },
      { status: 'Defense Scheduled', date: 'Pending', completed: false },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Review':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Draft':
        return 'bg-slate-100 text-slate-800 border-slate-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="text-slate-600 hover:text-slate-900">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Thesis List
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <Badge className={`border mb-3 ${getStatusColor(thesis.status)}`}>
            {thesis.status}
          </Badge>
          <h1 className="text-3xl text-slate-900 mb-2">{thesis.title}</h1>
          <p className="text-slate-600">{thesis.group.name}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Edit className="w-4 h-4" />
            Edit Thesis
          </Button>
          <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
            <Send className="w-4 h-4" />
            Submit for Review
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Abstract */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Abstract</h2>
            <p className="text-slate-700 leading-relaxed">{thesis.abstract}</p>
          </Card>

          {/* Activity Timeline */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-6">Progress Timeline</h2>
            <div className="space-y-4">
              {thesis.timeline.map((item, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.completed
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {item.completed ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    {index < thesis.timeline.length - 1 && (
                      <div
                        className={`w-0.5 h-12 ${
                          item.completed ? 'bg-green-300' : 'bg-slate-200'
                        }`}
                      ></div>
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-sm text-slate-900">{item.status}</p>
                    <p className="text-sm text-slate-600">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Documents */}
          <Card className="p-6 border-0 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-slate-900">Documents</h2>
              <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Add Document
              </Button>
            </div>
            <div className="space-y-3">
              {thesis.documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200">
                      <FileText className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-900">{doc.name}</p>
                      <p className="text-xs text-slate-600">
                        {doc.version} • {doc.date} • {doc.type}
                      </p>
                    </div>
                  </div>
                  <Badge className={`border ${getStatusColor(doc.status)}`}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Group Members */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-600" />
              Group Members
            </h2>
            <div className="space-y-3">
              {thesis.group.members.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-green-100 text-green-800 text-xs">
                      {member.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-600">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Adviser */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Adviser</h2>
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-blue-100 text-blue-800">
                  MS
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm text-slate-900">{thesis.adviser.name}</p>
                <p className="text-xs text-slate-600">{thesis.adviser.email}</p>
              </div>
            </div>
          </Card>

          {/* Panel Members */}
          <Card className="p-6 border-0 shadow-sm">
            <h2 className="text-slate-900 mb-4">Panel Members</h2>
            <div className="space-y-3">
              {thesis.panel.map((member, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm text-slate-900">{member.name}</p>
                    <p className="text-xs text-slate-600">{member.specialization}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-6 border-0 shadow-sm bg-gradient-to-br from-green-50 to-green-100">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-green-700">Total Documents</p>
                <p className="text-2xl text-green-900">{thesis.documents.length}</p>
              </div>
              <div>
                <p className="text-sm text-green-700">Progress</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex-1 h-2 bg-white rounded-full overflow-hidden">
                    <div className="h-full bg-green-600 rounded-full" style={{ width: '65%' }}></div>
                  </div>
                  <span className="text-sm text-green-900">65%</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
