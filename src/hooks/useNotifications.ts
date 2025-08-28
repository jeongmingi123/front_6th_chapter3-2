import { useCallback, useEffect, useState, useRef } from 'react';

import { Event } from '../types';
import { createNotificationMessage, getUpcomingEvents } from '../utils/notificationUtils';

export const useNotifications = (events: Event[]) => {
  const [notifications, setNotifications] = useState<{ id: string; message: string }[]>([]);
  const [notifiedEvents, setNotifiedEvents] = useState<string[]>([]);
  const notifiedEventsRef = useRef<string[]>([]);

  // notifiedEvents를 ref에도 동기화
  useEffect(() => {
    notifiedEventsRef.current = notifiedEvents;
  }, [notifiedEvents]);

  const checkUpcomingEvents = useCallback(() => {
    const now = new Date();
    const upcomingEvents = getUpcomingEvents(events, now, notifiedEventsRef.current);

    if (upcomingEvents.length > 0) {
      setNotifications((prev) => [
        ...prev,
        ...upcomingEvents.map((event) => ({
          id: event.id,
          message: createNotificationMessage(event),
        })),
      ]);

      setNotifiedEvents((prev) => [...prev, ...upcomingEvents.map(({ id }) => id)]);
    }
  }, [events]); // notifiedEvents 의존성 제거

  const removeNotification = (index: number) => {
    setNotifications((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const interval = setInterval(checkUpcomingEvents, 1000); // 1초마다 체크
    return () => clearInterval(interval);
  }, [checkUpcomingEvents]);

  return { notifications, notifiedEvents, setNotifications, removeNotification };
};
