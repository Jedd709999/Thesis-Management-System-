import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Clock, MapPin, List, Edit, Trash2, Eye } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Calendar } from '../../components/ui/calendar';
import { fetchSchedules, createSchedule, deleteSchedule } from '../../api/scheduleService';
import { fetchTheses } from '../../api/thesisService';
import { Schedule, Thesis, ScheduleFormData } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { format, parseISO, isSameDay } from 'date-fns';

// Interface removed to use the centralized ScheduleFormData from types/index.ts

interface ScheduleWithThesis extends Omit<Schedule, 'thesis'> {
  thesis: string | { id: string; title: string };
  date_time: string;
}

interface ScheduleManagementProps {
  userRole: 'student' | 'adviser' | 'panel' | 'admin';
}

export function ScheduleManagement({ userRole }: ScheduleManagementProps) {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<ScheduleWithThesis[]>([]);
  const [theses, setTheses] = useState<Thesis[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Form state for the schedule dialog
  const [formData, setFormData] = useState<ScheduleFormData>({
    thesis_id: '',
    date_time: '',
    location: '',
    duration_minutes: 60,
    notes: '',
    panel_ids: [],
    status: 'scheduled'
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch schedules and theses in parallel
        // Only fetch theses that are ready for defense
        console.log('Fetching theses with status filter');
        // Temporarily fetch all theses to see if any exist
        const [fetchedSchedules, fetchedTheses] = await Promise.all([
          fetchSchedules(),
          fetchTheses() // Remove status filter temporarily to see all theses
        ]);
        
        console.log('Full fetchedTheses response:', fetchedTheses);
        console.log('Type of fetchedTheses:', typeof fetchedTheses);
        console.log('Is fetchedTheses an array:', Array.isArray(fetchedTheses));
        if (Array.isArray(fetchedTheses)) {
          console.log('Number of theses:', fetchedTheses.length);
          if (fetchedTheses.length > 0) {
            console.log('First thesis:', fetchedTheses[0]);
          }
        }

        // Ensure fetchedTheses is an array before using it
        const validTheses = Array.isArray(fetchedTheses) ? fetchedTheses : [];
        console.log('Valid theses to set in state:', validTheses);
        
        // Set theses state first
        setTheses(validTheses);
        console.log('Theses state set to:', validTheses);
        
        // Then set schedules with the theses data
        setSchedules(
          fetchedSchedules.map(schedule => ({
            ...schedule,
            // Log schedule data for debugging
            ...(console.log('Schedule data:', schedule), {}),
            // Ensure date_time is a proper string and formatted for datetime-local input
            // Handle both date_time (new format) and start (old format) fields
            date_time: (schedule.date_time || (schedule as any).start) && 
              typeof (schedule.date_time || (schedule as any).start) === 'string' 
                ? (schedule.date_time || (schedule as any).start).includes('T') 
                  ? (schedule.date_time || (schedule as any).start).substring(0, 16)  // ISO format
                  : (schedule.date_time || (schedule as any).start)  // Already in datetime-local format
                : '',
            // Handle duration_minutes field
            duration_minutes: schedule.duration_minutes || 60,
            thesis: Array.isArray(validTheses) ? validTheses.find(t => t.id === schedule.thesis) || schedule.thesis : schedule.thesis,
            thesis_id: schedule.thesis as string
          }))
        );
        console.log('Schedules state set');
        setLoading(false);
        console.log('Loading state set to false');
      } catch (err) {
        console.error('Error fetching data:', err);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Helper function to format date and time
  const formatDateTime = (dateTimeString: string) => {
    // Check if dateTimeString is valid
    if (!dateTimeString || dateTimeString === '' || dateTimeString === 'null' || dateTimeString === 'undefined') {
      return 'Not scheduled';
    }
    
    try {
      // Additional validation for the date string format
      if (typeof dateTimeString !== 'string') {
        return 'Invalid date';
      }
      
      const date = parseISO(dateTimeString);
      
      // Check if the parsed date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      // Additional check to ensure the date is reasonable (not in the distant past or future)
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(now.getFullYear() + 5);
      
      if (date < oneYearAgo || date > fiveYearsFromNow) {
        return 'Invalid date';
      }
      
      return format(date, 'MMM d, yyyy h:mm a');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Helper function to get thesis title
  const getThesisTitle = (thesis: string | { id: string; title: string }) => {
    console.log('getThesisTitle called with:', thesis);
    console.log('Current theses state:', theses);
    console.log('Is theses an array:', Array.isArray(theses));
    
    // Ensure theses is an array before using it
    const validThesesArray = Array.isArray(theses) ? theses : [];
    
    if (typeof thesis === 'string' && validThesesArray.length > 0) {
      const foundThesis = validThesesArray.find(t => t.id === thesis);
      return foundThesis?.title || 'Thesis';
    }
    // At this point, thesis is guaranteed to be an object with id and title properties
    if (typeof thesis === 'object' && thesis !== null) {
      return (thesis as { id: string; title: string }).title || 'Thesis';
    }
    return 'Thesis';
  };

  // Helper function to get defense type based on thesis status
  const getDefenseType = (thesisStatus: string) => {
    console.log('Checking defense type for thesis status:', thesisStatus);
    switch (thesisStatus) {
      case 'CONCEPT_SCHEDULED':
        return 'Concept Defense';
      case 'PROPOSAL_SCHEDULED':
        return 'Proposal Defense';
      case 'FINAL_SCHEDULED':
        return 'Final Defense';
      default:
        console.log('Unknown defense type for thesis status:', thesisStatus);
        return 'Unknown Defense';
    }
  };

  // Helper function to get thesis status from schedule
  const getThesisStatus = (schedule: ScheduleWithThesis): string => {
    // If thesis is an object with a status property, return that
    if (typeof schedule.thesis === 'object' && schedule.thesis !== null && 'status' in schedule.thesis) {
      return (schedule.thesis as Thesis).status;
    }
    // If we have a thesis_id, try to find the thesis in our theses array
    if (typeof schedule.thesis === 'string') {
      const thesis = theses.find(t => t.id === schedule.thesis);
      return thesis ? thesis.status : 'UNKNOWN';
    }
    return 'UNKNOWN';
  };

  // Format duration in minutes to hours and minutes
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Get schedules for a specific date
  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(schedule => {
      if (!schedule.date_time) return false;
      const scheduleDate = new Date(schedule.date_time);
      return isSameDay(scheduleDate, date);
    });
  };

  // Get scheduled dates for calendar markers
  const getScheduledDates = () => {
    return schedules
      .filter(schedule => schedule.date_time)
      .map(schedule => new Date(schedule.date_time));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'rescheduled':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' ? parseInt(value) || 0 : value
    }));
  };
  


  // Reset form to initial state
  const resetForm = () => {
    setFormData({
      thesis_id: '',
      date_time: '',
      location: '',
      duration_minutes: 60,
      notes: '',
      panel_ids: [],
      status: 'scheduled'
    });
    setFormError('');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    
    // Log form data for debugging
    console.log('Form data before submission:', formData);
    
    // Log the raw date_time value
    console.log('Raw date_time value:', formData.date_time);
    
    // Try to parse the date for debugging
    const testDate = new Date(formData.date_time);
    console.log('Parsed date:', testDate);
    console.log('Is valid date:', !isNaN(testDate.getTime()));

    // Basic validation
    if (!formData.thesis_id || !formData.date_time || !formData.location) {
      setFormError('Please fill in all required fields');
      return;
    }
    
    // Date validation
    const selectedDate = new Date(formData.date_time);
    const now = new Date();
    if (selectedDate < now) {
      setFormError('Selected date and time must be in the future');
      return;
    }

    try {
      // Prepare schedule data
      const scheduleData: ScheduleFormData = {
        thesis_id: formData.thesis_id,
        date_time: formData.date_time,
        location: formData.location,
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        panel_ids: formData.panel_ids,
        status: formData.status
      };

      // Create schedule
      const newSchedule = await createSchedule(scheduleData);

      // Update local state with the new schedule
      setSchedules(prev => [
        ...prev,
        {
          ...newSchedule,
          // Log the schedule data for debugging
          ...(console.log('New schedule data:', newSchedule), {}),
          // Ensure date_time is a proper string and formatted for datetime-local input
          // Handle both date_time (new format) and start (old format) fields
          date_time: (newSchedule.date_time || (newSchedule as any).start) && 
            typeof (newSchedule.date_time || (newSchedule as any).start) === 'string' 
            ? (newSchedule.date_time || (newSchedule as any).start).includes('T') 
              ? (newSchedule.date_time || (newSchedule as any).start).substring(0, 16)  // ISO format
              : (newSchedule.date_time || (newSchedule as any).start)  // Already in datetime-local format
            : '',
          // Handle duration_minutes field
          duration_minutes: newSchedule.duration_minutes || 60,
          thesis: theses.find(t => t.id === newSchedule.thesis) || newSchedule.thesis,
          thesis_id: newSchedule.thesis as string
        }
      ]);

      // Close dialog and reset form
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      
      // Provide more specific error messages
      if (error.response && error.response.data) {
        const errorData = error.response.data;
        if (errorData.time_validation) {
          setFormError(`Time validation error: ${errorData.time_validation.join(', ')}`);
        } else if (errorData.start) {
          setFormError(`Start time error: ${errorData.start.join(', ')}`);
        } else if (errorData.end) {
          setFormError(`End time error: ${errorData.end.join(', ')}`);
        } else if (errorData.detail) {
          setFormError(errorData.detail);
        } else {
          setFormError('Failed to create schedule. Please check your inputs and try again.');
        }
      } else if (error.message) {
        setFormError(`Error: ${error.message}`);
      } else {
        setFormError('Failed to create schedule. Please try again.');
      }
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    try {
      await deleteSchedule(scheduleId);
      setSchedules(prev => prev.filter(schedule => schedule.id !== scheduleId));
    } catch (error) {
      console.error('Error deleting schedule:', error);
      setFormError('Failed to delete schedule. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl text-slate-900 mb-2">Thesis Defense Schedules</h1>
            <p className="text-slate-600">Loading schedules...</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-slate-900 mb-2">Thesis Defense Schedules</h1>
          <p className="text-slate-600">View and manage thesis defense schedules</p>
        </div>
        {userRole === 'admin' && (
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
              <form onSubmit={handleSubmit} className="space-y-4">
                {formError && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Thesis</label>
                  <select
                    name="thesis_id"
                    value={formData.thesis_id}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a thesis</option>
                    {(() => {
                      console.log('Rendering thesis dropdown, theses state:', theses);
                      console.log('Is theses an array:', Array.isArray(theses));
                      console.log('Theses length:', theses?.length);
                      
                      // Ensure theses is an array before mapping
                      const validThesesArray = Array.isArray(theses) ? theses : [];
                      console.log('Valid theses array:', validThesesArray);
                      console.log('Valid theses array length:', validThesesArray.length);
                      
                      if (validThesesArray.length > 0) {
                        console.log('Mapping over theses to create options');
                        return validThesesArray.map(thesis => {
                          console.log('Creating option for thesis:', thesis);
                          return (
                            <option key={thesis.id} value={thesis.id}>
                              {thesis.title}
                            </option>
                          );
                        });
                      } else {
                        console.log('No theses available, showing appropriate message');
                        return (
                          <option value="" disabled>
                            {loading ? "Loading..." : "No theses available"}
                          </option>
                        );
                      }
                    })()}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date & Time</label>
                  <input
                    type="datetime-local"
                    name="date_time"
                    value={formData.date_time ? formData.date_time.substring(0, 16) : ''}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                    min={new Date().toISOString().substring(0, 16)}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Room 101, Main Building"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    name="duration_minutes"
                    min="30"
                    max="240"
                    step="15"
                    value={formData.duration_minutes}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Any additional notes or special requirements"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-700 hover:bg-green-800">
                    Schedule Defense
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Calendar and List View */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Section - Tables */}
          <div className="space-y-6">
            {/* Upcoming Defenses Table */}
            <div className="w-full">
              <Card className="border-0 shadow-sm overflow-hidden p-0">
                <div className="p-6 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-800">Upcoming Defenses</h2>
                </div>
                {schedules.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">No Scheduled Defenses</h3>
                    {userRole === 'adviser' && (
                      <p className="text-slate-500">Click the button above to schedule a new defense.</p>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Thesis Title</th>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Defense Type</th>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Date & Time</th>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Location</th>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Duration</th>
                          <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Status</th>
                          {userRole === 'admin' && (
                            <th className="px-6 py-4 text-left text-xs uppercase tracking-wider text-slate-600">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {schedules.map((schedule) => (
                          <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-900">{getThesisTitle(schedule.thesis)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-900">{getDefenseType(getThesisStatus(schedule))}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">{formatDateTime(schedule.date_time)}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">{schedule.location || '-'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-slate-600">
                                {schedule.duration_minutes && schedule.duration_minutes > 0 
                                  ? formatDuration(schedule.duration_minutes) 
                                  : '-'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <Badge className={`border ${getStatusColor(schedule.status || 'scheduled')}`}>
                                {schedule.status?.replace('_', ' ') || 'scheduled'}
                              </Badge>
                            </td>
                            {userRole === 'admin' && (
                              <td className="px-6 py-4">
                                <div className="flex space-x-2">
                                  <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="p-2 h-8 w-8 text-red-600 hover:text-red-700"
                                    onClick={() => handleDeleteSchedule(schedule.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
            
            {/* Schedules for Selected Date */}
            {selectedDate && (
              <div className="w-full">
                <Card className="border-0 shadow-sm overflow-hidden p-0">
                  <div className="p-6 border-b border-slate-200">
                    <h2 className="text-xl font-semibold text-slate-800">
                      Defenses on {format(selectedDate, 'MMMM d, yyyy')}
                    </h2>
                  </div>
                  {getSchedulesForDate(selectedDate).length === 0 ? (
                    <div className="py-8 text-center">
                      <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No defenses scheduled for this date</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600">Thesis</th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600">Defense Type</th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600">Time</th>
                            <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600">Location</th>
                            {userRole === 'admin' && (
                              <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-slate-600">Actions</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {getSchedulesForDate(selectedDate).map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3">
                                <p className="text-sm text-slate-900 font-medium">{getThesisTitle(schedule.thesis)}</p>
                              </td>
                              <td className="px-6 py-3">
                                <p className="text-sm text-slate-900">{getDefenseType(getThesisStatus(schedule))}</p>
                              </td>
                              <td className="px-6 py-3">
                                <p className="text-sm text-slate-600">
                                  {schedule.date_time ? format(parseISO(schedule.date_time), 'h:mm a') : '-'}
                                </p>
                              </td>
                              <td className="px-6 py-3">
                                <p className="text-sm text-slate-600">{schedule.location || '-'}</p>
                              </td>
                              {userRole === 'admin' && (
                                <td className="px-6 py-3">
                                  <div className="flex space-x-2">
                                    <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" className="p-2 h-8 w-8">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      className="p-2 h-8 w-8 text-red-600 hover:text-red-700"
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
          
          {/* Right Section - Calendar */}
          <div>
            <Card className="p-6 h-full">
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-800 mb-2">Calendar</h2>
                <p className="text-sm text-slate-600">Select a date to view scheduled defenses</p>
              </div>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border w-full"
                modifiers={{
                  scheduled: getScheduledDates()
                }}
                modifiersClassNames={{
                  scheduled: "bg-green-100 text-green-800"
                }}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-6 sm:space-x-6 sm:space-y-0 w-full",
                  month: "space-y-6 w-full",
                  caption: "flex justify-center pt-2 relative items-center w-full",
                  caption_label: "text-base font-medium",
                  nav: "space-x-2 flex items-center",
                  nav_button: "h-9 w-9 bg-transparent p-0 opacity-50 hover:opacity-100",
                  table: "w-full border-collapse space-y-2",
                  head_row: "flex w-full",
                  head_cell: "text-muted-foreground rounded-md w-12 font-normal text-[0.9rem] flex-1",
                  row: "flex w-full mt-3",
                  cell: "h-16 w-16 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center text-lg",
                  day: "h-16 w-16 p-0 font-normal aria-selected:opacity-100 flex items-center justify-center text-lg",
                  day_selected:
                    "bg-green-700 text-white hover:bg-green-800 focus:bg-green-700",
                  day_today: "bg-green-100 text-green-800 font-bold",
                  day_outside:
                    "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                  day_disabled: "text-muted-foreground opacity-50",
                  day_range_middle:
                    "aria-selected:bg-accent aria-selected:text-accent-foreground",
                  day_hidden: "invisible",
                }}
              />
              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h3 className="text-sm font-medium text-slate-700 mb-2">Legend</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-100 rounded-sm mr-2"></div>
                    <span className="text-xs text-slate-600">Scheduled</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-4 h-4 bg-green-700 rounded-sm mr-2"></div>
                    <span className="text-xs text-slate-600">Selected</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
