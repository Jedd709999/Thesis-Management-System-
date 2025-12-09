import { Clock, MessageSquare, Users, Save, Upload, X, Eye } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

export function GoogleDocsEmbed() {
  const document = {
    name: 'Chapter 1: Introduction',
    version: 'v1.3',
    lastSaved: '2 minutes ago',
  };

  const versionHistory = [
    { version: 'v1.3', author: 'John Smith', date: 'Nov 15, 2:45 PM', changes: 'Updated methodology section' },
    { version: 'v1.2', author: 'Dr. Maria Santos', date: 'Nov 15, 1:20 PM', changes: 'Added feedback comments' },
    { version: 'v1.1', author: 'John Smith', date: 'Nov 14, 4:30 PM', changes: 'Initial draft completed' },
    { version: 'v1.0', author: 'Maria Garcia', date: 'Nov 14, 10:15 AM', changes: 'Created document' },
  ];

  const comments = [
    {
      author: 'Dr. Maria Santos',
      role: 'Adviser',
      text: 'This section needs more detail on the research methodology. Please expand.',
      time: '1 hour ago',
      resolved: false,
    },
    {
      author: 'Dr. James Wilson',
      role: 'Panel',
      text: 'Great introduction! The literature review is comprehensive.',
      time: '3 hours ago',
      resolved: true,
    },
    {
      author: 'Maria Garcia',
      role: 'Team Member',
      text: 'Should we add more references to recent climate studies?',
      time: '5 hours ago',
      resolved: false,
    },
  ];

  const presenceIndicators = [
    { name: 'Dr. Maria Santos', status: 'viewing', color: 'bg-blue-500' },
    { name: 'John Smith', status: 'editing', color: 'bg-green-500' },
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-slate-900">{document.name}</h1>
              <p className="text-xs text-slate-500">
                {document.version} • Last saved {document.lastSaved}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Presence Indicators */}
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-lg border border-slate-200">
              <Users className="w-4 h-4 text-slate-600" />
              {presenceIndicators.map((person, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 ${person.color} rounded-full`}></div>
                  <span className="text-xs text-slate-600">
                    {person.name.split(' ')[0]} {person.status}
                  </span>
                </div>
              ))}
            </div>

            <Button variant="outline" className="flex items-center gap-2">
              <Save className="w-4 h-4" />
              Save Draft
            </Button>

            <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
              <Upload className="w-4 h-4" />
              Publish Update
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Document Preview */}
        <div className="flex-1 p-8 overflow-y-auto">
          <Card className="max-w-4xl mx-auto border-0 shadow-lg">
            {/* Google Docs Embed Placeholder */}
            <div className="aspect-[8.5/11] bg-white p-12 rounded-lg">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl text-slate-900 mb-2">Chapter 1: Introduction</h2>
                  <p className="text-sm text-slate-600">Impact of Climate Change on Rainforest Biodiversity</p>
                </div>

                <div className="space-y-4 text-slate-700">
                  <p className="leading-relaxed">
                    Climate change represents one of the most significant environmental challenges of the 21st century, 
                    with far-reaching implications for biodiversity and ecosystem stability. This research focuses on 
                    the intricate relationship between climate variability and biodiversity patterns in Southeast Asian 
                    rainforests, which are recognized as biodiversity hotspots of global importance.
                  </p>

                  <p className="leading-relaxed">
                    Tropical rainforests serve as critical repositories of biological diversity, harboring approximately 
                    50% of the world's terrestrial species despite covering only 7% of the Earth's land surface. The 
                    sensitivity of these ecosystems to climatic variations makes them particularly vulnerable to the 
                    accelerating impacts of anthropogenic climate change.
                  </p>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-4">
                    <div className="flex items-start gap-3">
                      <MessageSquare className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm text-yellow-900">
                          <span>Dr. Maria Santos:</span> This section needs more detail on the research 
                          methodology. Please expand.
                        </p>
                        <p className="text-xs text-yellow-700 mt-1">1 hour ago</p>
                      </div>
                    </div>
                  </div>

                  <p className="leading-relaxed">
                    Through comprehensive field studies conducted over three years (2021-2024), this research 
                    investigates the effects of temperature variations, precipitation patterns, and extreme weather 
                    events on species distribution, population dynamics, and ecosystem resilience. Our methodology 
                    combines traditional ecological surveys with advanced remote sensing techniques and statistical 
                    modeling to provide a holistic understanding of climate-biodiversity interactions.
                  </p>

                  <p className="leading-relaxed">
                    The findings of this study contribute to the growing body of evidence linking climate change to 
                    biodiversity loss and provide crucial insights for conservation strategies and policy development. 
                    Understanding these complex relationships is essential for developing effective mitigation and 
                    adaptation strategies to preserve the ecological integrity of tropical rainforests for future 
                    generations.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200">
                <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span>Connected to Google Docs</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span>Live Editing Enabled</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col">
          {/* Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex">
              <button className="flex-1 px-4 py-3 text-sm bg-slate-50 text-slate-900 border-b-2 border-green-600">
                Comments
              </button>
              <button className="flex-1 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                Version History
              </button>
            </div>
          </div>

          {/* Comments Panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {comments.map((comment, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border transition-colors ${
                  comment.resolved
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-green-100 text-green-800">
                        {comment.author.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-slate-900">{comment.author}</p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${
                          comment.role === 'Adviser'
                            ? 'bg-blue-100 text-blue-800'
                            : comment.role === 'Panel'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {comment.role}
                      </Badge>
                    </div>
                  </div>
                  {comment.resolved && (
                    <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                      Resolved
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-slate-700 mb-2">{comment.text}</p>
                <p className="text-xs text-slate-500">{comment.time}</p>
                {!comment.resolved && (
                  <Button variant="ghost" size="sm" className="mt-2 text-xs">
                    Mark as Resolved
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Add Comment */}
          <div className="border-t border-slate-200 p-4">
            <textarea
              placeholder="Add a comment..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              rows={3}
            ></textarea>
            <Button className="w-full mt-2 bg-primary hover:bg-primary/90 text-primary-foreground">
              Post Comment
            </Button>
          </div>
        </div>

        {/* Version History Sidebar (Hidden by default) */}
        <div className="hidden w-80 bg-white border-l border-slate-200 p-4 overflow-y-auto">
          <h2 className="text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Version History
          </h2>
          <div className="space-y-3">
            {versionHistory.map((version, index) => (
              <div key={index} className="p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline">{version.version}</Badge>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                </div>
                <p className="text-sm text-slate-900 mb-1">{version.changes}</p>
                <p className="text-xs text-slate-600">{version.author}</p>
                <p className="text-xs text-slate-500">{version.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
