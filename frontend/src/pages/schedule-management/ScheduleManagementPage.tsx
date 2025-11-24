import { useState } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, Users, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

interface ScheduleManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

const mockSchedules = [
  {
    id: '1',
    group: 'Rainforest Biodiversity Team',
    date: 'Dec 18, 2024',
    time: '9:00 AM - 11:00 AM',
    location: 'Environmental Science Building, Room 301',
    adviser: 'Dr. Maria Santos',
    panel: ['Dr. James Wilson', 'Dr. Elena Rodriguez'],
    type: 'Proposal Defense',
    status: 'Confirmed',
  },
  {
    id: '2',
    group: 'Marine Conservation Team',
    date: 'Dec 19, 2024',
    time: '2:00 PM - 4:00 PM',
    location: 'Environmental Science Building, Room 205',
    adviser: 'Dr. Elena Rodriguez',
    panel: ['Dr. David Park', 'Dr. Sarah Johnson'],
    type: 'Progress Review',
    status: 'Confirmed',
  },
  {
    id: '3',
    group: 'Sustainable Energy Group',
    date: 'Dec 20, 2024',
    time: '10:00 AM - 12:00 PM',
    location: 'Environmental Science Building, Room 301',
    adviser: 'Dr. Michael Chen',
    panel: ['Dr. James Wilson', 'Dr. Elena Rodriguez'],
    type: 'Final Defense',
    status: 'Pending',
  },
];

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const timeSlots = [
  '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
];

export function ScheduleManagement({ userRole }: ScheduleManagementProps) {
  const [selectedDate, setSelectedDate] = useState('Dec 18-22, 2024');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Schedule Management</h1>
          <p className="text-slate-600">Manage thesis defenses and review sessions with conflict detection</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-700 hover:bg-green-800 text-white flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Schedule Defense
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Defense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">Defense Type</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Proposal Defense</option>
                  <option>Progress Review</option>
                  <option>Final Defense</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Select Group</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Rainforest Biodiversity Team</option>
                  <option>Marine Conservation Team</option>
                  <option>Urban Ecology Group</option>
                  <option>Sustainable Energy Group</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-700 mb-2">Time</label>
                  <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                    <option>9:00 AM - 11:00 AM</option>
                    <option>10:00 AM - 12:00 PM</option>
                    <option>2:00 PM - 4:00 PM</option>
                    <option>3:00 PM - 5:00 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Location</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Environmental Science Building, Room 301</option>
                  <option>Environmental Science Building, Room 205</option>
                  <option>Research Center, Conference Room A</option>
                  <option>Research Center, Conference Room B</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Adviser</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option>Dr. Maria Santos</option>
                  <option>Dr. James Wilson</option>
                  <option>Dr. Elena Rodriguez</option>
                  <option>Dr. Michael Chen</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-2">Panel Members</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <label className="text-sm text-slate-700">Dr. James Wilson</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <label className="text-sm text-slate-700">Dr. Elena Rodriguez</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <label className="text-sm text-slate-700">Dr. David Park</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <label className="text-sm text-slate-700">Dr. Sarah Johnson</label>
                  </div>
                </div>
              </div>

              {/* Conflict Alert */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-900">Scheduling Conflict Detected</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Dr. James Wilson has another defense scheduled at this time. Room 301 is already booked.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button className="bg-green-700 hover:bg-green-800 text-white">
                  Schedule Defense
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Calendar Navigation */}
      <Card className="p-4 border-0 shadow-sm">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous Week
          </Button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            <span className="text-slate-900">{selectedDate}</span>
          </div>
          <Button variant="ghost" size="sm">
            Next Week
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Calendar Week View */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header */}
            <div className="grid grid-cols-6 bg-slate-50 border-b border-slate-200">
              <div className="p-4 border-r border-slate-200">
                <span className="text-xs uppercase tracking-wider text-slate-600">Time</span>
              </div>
              {weekDays.map((day, index) => (
                <div key={index} className="p-4 border-r border-slate-200 last:border-r-0">
                  <p className="text-xs uppercase tracking-wider text-slate-600">{day}</p>
                  <p className="text-sm text-slate-900">Dec {18 + index}</p>
                </div>
              ))}
            </div>

            {/* Time Slots */}
            <div className="divide-y divide-slate-200">
              {timeSlots.map((time, timeIndex) => (
                <div key={timeIndex} className="grid grid-cols-6">
                  <div className="p-3 border-r border-slate-200 bg-slate-50">
                    <span className="text-xs text-slate-600">{time}</span>
                  </div>
                  {weekDays.map((_, dayIndex) => {
                    // Mock schedule placement
                    const hasSchedule = timeIndex === 1 && dayIndex === 0;
                    const hasSchedule2 = timeIndex === 6 && dayIndex === 1;
                    const hasSchedule3 = timeIndex === 2 && dayIndex === 2;

                    return (
                      <div
                        key={dayIndex}
                        className="p-2 border-r border-slate-200 last:border-r-0 min-h-[60px] hover:bg-slate-50 transition-colors"
                      >
                        {hasSchedule && (
                          <div className="p-2 bg-green-100 border-l-4 border-green-600 rounded text-xs">
                            <p className="text-green-900 mb-1">Proposal Defense</p>
                            <p className="text-green-700">Rainforest Team</p>
                            <p className="text-green-600">Room 301</p>
                          </div>
                        )}
                        {hasSchedule2 && (
                          <div className="p-2 bg-blue-100 border-l-4 border-blue-600 rounded text-xs">
                            <p className="text-blue-900 mb-1">Progress Review</p>
                            <p className="text-blue-700">Marine Team</p>
                            <p className="text-blue-600">Room 205</p>
                          </div>
                        )}
                        {hasSchedule3 && (
                          <div className="p-2 bg-purple-100 border-l-4 border-purple-600 rounded text-xs">
                            <p className="text-purple-900 mb-1">Final Defense</p>
                            <p className="text-purple-700">Energy Group</p>
                            <p className="text-purple-600">Room 301</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Upcoming Schedules List */}
      <Card className="p-6 border-0 shadow-sm">
        <h2 className="text-slate-900 mb-6">Upcoming Defenses</h2>
        <div className="space-y-4">
          {mockSchedules.map((schedule) => (
            <div
              key={schedule.id}
              className="p-5 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-slate-900">{schedule.group}</h3>
                    <Badge
                      variant="secondary"
                      className={
                        schedule.type === 'Proposal Defense'
                          ? 'bg-green-100 text-green-800'
                          : schedule.type === 'Progress Review'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }
                    >
                      {schedule.type}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={
                        schedule.status === 'Confirmed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {schedule.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <CalendarIcon className="w-4 h-4 text-green-600" />
                  <span>{schedule.date}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{schedule.time}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  <span>{schedule.location}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Adviser</p>
                    <p className="text-sm text-slate-900">{schedule.adviser}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 mb-1">Panel</p>
                    <div className="flex -space-x-2">
                      {schedule.panel.map((member, index) => (
                        <Avatar key={index} className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                            {member.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                  <Button variant="ghost" size="sm" className="text-green-700">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
