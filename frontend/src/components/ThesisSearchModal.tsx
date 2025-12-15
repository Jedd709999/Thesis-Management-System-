import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Calendar, MapPin, Users, User, BookOpen } from 'lucide-react'

interface SearchResult {
  id: string
  title: string
  abstract: string
  keywords: string
  status: string
  status_display: string
  group_name: string | null
  group_leader: string | null
  group_leader_email: string | null
  proposer_name: string | null
  proposer_email: string | null
  adviser_name: string | null
  adviser_email: string | null
  panel_members: string[]
  group_members: string[]
  created_at: string
  updated_at: string
  created_date_display: string
  created_time_display: string
  location: string
}

interface ThesisSearchModalProps {
  isOpen: boolean
  onClose: () => void
  query: string
  exists: boolean
  results: SearchResult[]
  message: string
}

export const ThesisSearchModal: React.FC<ThesisSearchModalProps> = ({
  isOpen,
  onClose,
  query,
  exists,
  results,
  message,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Thesis Topic Search Results
          </DialogTitle>
          <DialogDescription>
            Search query: "{query}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Message */}
          <div className={`p-4 rounded-lg border ${
            exists
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}>
            <p className="font-medium">{message}</p>
            {exists && (
              <p className="text-sm mt-1">
                Found {Array.isArray(results) ? results.length : 0} similar thesis topic{Array.isArray(results) && results.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>

          {/* Results */}
          {exists && Array.isArray(results) && results.length > 0 && (
            <div className="space-y-4">
              {results.map((result, index) => (
                <Card key={result.id} className="w-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">{result.title}</CardTitle>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{result.status_display}</Badge>
                          {result.keywords && (
                            <Badge variant="secondary" className="text-xs">
                              {Array.isArray(result.keywords) ? result.keywords.join(', ') : result.keywords}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Abstract */}
                    {result.abstract && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">Abstract</h4>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {result.abstract}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {/* Group Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          Group Information
                        </h4>
                        <div className="space-y-1 text-sm">
                          {result.group_name && (
                            <p><span className="font-medium">Group:</span> {result.group_name}</p>
                          )}
                          {result.group_leader && (
                            <p><span className="font-medium">Leader:</span> {result.group_leader}</p>
                          )}
                        </div>
                      </div>

                      {/* People Involved */}
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-1">
                          <User className="w-4 h-4" />
                          People Involved
                        </h4>
                        <div className="space-y-1 text-sm">
                          {result.proposer_name && (
                            <p><span className="font-medium">Proposer:</span> {result.proposer_name}</p>
                          )}
                          {result.adviser_name && (
                            <p><span className="font-medium">Adviser:</span> {result.adviser_name}</p>
                          )}
                          {Array.isArray(result.group_members) && result.group_members.length > 0 && (
                            <div>
                              <span className="font-medium">Group Members:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {result.group_members.map((member, idx) => (
                                  <li key={idx} className="text-xs">{member}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {Array.isArray(result.panel_members) && result.panel_members.length > 0 && (
                            <div>
                              <span className="font-medium">Panel Members:</span>
                              <ul className="list-disc list-inside ml-2 mt-1">
                                {result.panel_members.map((member, idx) => (
                                  <li key={idx} className="text-xs">{member}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Date and Location */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Created: {result.created_date_display} at {result.created_time_display}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{result.location}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* No Results Message */}
          {!exists && (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                This thesis topic is not yet existed. You can proceed with your topic proposal.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}