import { useSnackbar } from 'notistack';
import { useEffect, useState } from 'react';

import { Event, EventForm } from '../types';
import { generateRepeatEvents, convertRepeatEventToSingle } from '../utils/repeatEventUtils';

export const useEventOperations = (editing: boolean, onSave?: () => void) => {
  const [events, setEvents] = useState<Event[]>([]);
  const { enqueueSnackbar } = useSnackbar();

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const { events } = await response.json();
      setEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      enqueueSnackbar('이벤트 로딩 실패', { variant: 'error' });
    }
  };

  const saveEvent = async (eventData: Event | EventForm, skipFetchEvents = false) => {
    try {
      let response;

      if (editing) {
        // 수정 시: 반복 일정을 단일 일정으로 변환
        const eventToUpdate = eventData as Event;
        if (eventToUpdate.isRepeatEvent) {
          const singleEvent = convertRepeatEventToSingle(eventToUpdate);
          response = await fetch(`/api/events/${eventToUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(singleEvent),
          });
        } else {
          response = await fetch(`/api/events/${eventToUpdate.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      } else {
        // 새 일정 생성 시: 반복 일정이면 반복 일정들만 생성
        if (eventData.repeat.type !== 'none') {
          const repeatEvents = generateRepeatEvents(eventData);

          // 반복 일정들을 한 번에 처리 (개별 저장하지 않음)
          // 이 경우에는 실제로는 아무것도 저장하지 않고,
          // App.tsx에서 반복 일정들을 직접 처리하도록 함
          response = { ok: true } as Response;
        } else {
          response = await fetch('/api/events', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventData),
          });
        }
      }

      if (!response?.ok) {
        throw new Error('Failed to save event');
      }

      // skipFetchEvents가 true면 fetchEvents를 호출하지 않음
      if (!skipFetchEvents) {
        await fetchEvents();
      }

      onSave?.();
      enqueueSnackbar(editing ? '일정이 수정되었습니다.' : '일정이 추가되었습니다.', {
        variant: 'success',
      });
    } catch (error) {
      console.error('Error saving event:', error);
      enqueueSnackbar('일정 저장 실패', { variant: 'error' });
    }
  };

  const deleteEvent = async (id: string) => {
    try {
      const response = await fetch(`/api/events/${id}`, { method: 'DELETE' });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      await fetchEvents();
      enqueueSnackbar('일정이 삭제되었습니다.', { variant: 'info' });
    } catch (error) {
      console.error('Error deleting event:', error);
      enqueueSnackbar('일정 삭제 실패', { variant: 'error' });
    }
  };

  async function init() {
    await fetchEvents();
    enqueueSnackbar('일정 로딩 완료!', { variant: 'info' });
  }

  useEffect(() => {
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { events, fetchEvents, saveEvent, deleteEvent };
};
