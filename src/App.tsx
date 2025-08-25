import { Box, Stack } from '@mui/material';
import { useState } from 'react';

import { CalendarView } from './components/CalendarView';
import { EventForm } from './components/EventForm';
import { EventList } from './components/EventList';
import { NotificationStack } from './components/NotificationStack';
import { RepeatEventDialog } from './components/RepeatEventDialog';
import { useCalendarView } from './hooks/useCalendarView.ts';
import { useEventOperations } from './hooks/useEventOperations.ts';
import { useNotifications } from './hooks/useNotifications.ts';
import { useSearch } from './hooks/useSearch.ts';
import { Event } from './types';
import { findOverlappingEvents } from './utils/eventOverlap';
import { generateRepeatEvents } from './utils/repeatEventUtils';

function App() {
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const { events, saveEvent, deleteEvent } = useEventOperations(Boolean(editingEvent), () =>
    setEditingEvent(null)
  );

  const { notifications, notifiedEvents, setNotifications } = useNotifications(events);
  const { view, setView, currentDate, holidays, navigate } = useCalendarView();
  const { searchTerm, filteredEvents, setSearchTerm } = useSearch(events, currentDate, view);

  const [isOverlapDialogOpen, setIsOverlapDialogOpen] = useState(false);
  const [overlappingEvents, setOverlappingEvents] = useState<Event[]>([]);

  const handleEventSubmit = async (eventData: Event) => {
    // 반복 일정이 설정된 경우 모든 반복 일정에 대해 겹침 검사
    let overlapping = findOverlappingEvents(eventData, events);

    if (eventData.repeat.type !== 'none' && eventData.repeat.interval) {
      const repeatEvents = generateRepeatEvents(eventData, eventData.repeat.endDate);
      for (const repeatEvent of repeatEvents) {
        const repeatOverlapping = findOverlappingEvents(repeatEvent, events);
        overlapping = [...overlapping, ...repeatOverlapping];
      }
    }

    if (overlapping.length > 0) {
      setOverlappingEvents(overlapping);
      setIsOverlapDialogOpen(true);
    } else {
      // 원본 일정을 먼저 저장하여 ID를 얻음
      await saveEvent(eventData);
      setEditingEvent(null);
    }
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
  };

  const handleCancelEdit = () => {
    setEditingEvent(null);
  };

  const handleOverlapContinue = async () => {
    if (editingEvent) {
      await saveEvent(editingEvent);
      setEditingEvent(null);
    }
    setIsOverlapDialogOpen(false);
  };

  return (
    <Box sx={{ width: '100%', height: '100vh', margin: 'auto', p: 5 }}>
      <Stack direction="row" spacing={6} sx={{ height: '100%' }}>
        <EventForm
          editingEvent={editingEvent}
          onSubmit={handleEventSubmit}
          onCancel={handleCancelEdit}
        />

        <CalendarView
          view={view}
          currentDate={currentDate}
          holidays={holidays}
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          onNavigate={navigate}
          onViewChange={setView}
        />

        <EventList
          searchTerm={searchTerm}
          filteredEvents={filteredEvents}
          notifiedEvents={notifiedEvents}
          onSearchChange={setSearchTerm}
          onEditEvent={handleEditEvent}
          onDeleteEvent={deleteEvent}
        />
      </Stack>

      <RepeatEventDialog
        open={isOverlapDialogOpen}
        overlappingEvents={overlappingEvents}
        onClose={() => setIsOverlapDialogOpen(false)}
        onContinue={handleOverlapContinue}
      />

      <NotificationStack
        notifications={notifications}
        onRemoveNotification={(index) =>
          setNotifications((prev) => prev.filter((_, i) => i !== index))
        }
      />
    </Box>
  );
}

export default App;
