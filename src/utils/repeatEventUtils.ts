import { Event, EventForm, RepeatType } from '../types';

/**
 * 반복 일정을 생성합니다.
 * @param eventData 원본 일정 데이터
 * @param maxEndDate 최대 종료 날짜 (예: 2025-10-30)
 * @returns 생성된 반복 일정 배열
 */
export function generateRepeatEvents(
  eventData: EventForm,
  maxEndDate: string = '2025-10-30'
): Event[] {
  const { repeat, ...baseEvent } = eventData;

  if (repeat.type === 'none') {
    return [];
  }

  const startDate = new Date(eventData.date);
  const endDate = repeat.endDate ? new Date(repeat.endDate) : new Date(maxEndDate);
  const maxDate = new Date(Math.min(endDate.getTime(), new Date(maxEndDate).getTime()));

  const events: Event[] = [];
  let currentDate = new Date(startDate);
  let eventIndex = 0;

  // 시작 날짜부터 종료 날짜까지 반복 일정 생성
  while (currentDate <= maxDate) {
    const eventDate = formatDate(currentDate);

    // 반복 일정 생성 (원본 날짜 포함)
    const repeatEvent: Event = {
      ...baseEvent,
      id: `${baseEvent.title}_${eventIndex}_${Date.now()}`,
      date: eventDate,
      repeat: repeat,
      isRepeatEvent: true,
      originalEventId: `original_${Date.now()}`,
      repeatEventIndex: eventIndex,
    };

    events.push(repeatEvent);
    eventIndex++;

    // 다음 반복 날짜 계산
    currentDate = getNextRepeatDate(currentDate, repeat.type, repeat.interval);
  }

  return events;
}

/**
 * 반복 유형에 따라 다음 반복 날짜를 계산합니다.
 */
function getNextRepeatDate(currentDate: Date, repeatType: RepeatType, interval: number): Date {
  const nextDate = new Date(currentDate);

  switch (repeatType) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + 7 * interval);
      break;
    case 'monthly':
      // 매월 같은 날짜로 설정 (31일의 경우 월말로 조정)
      const targetDay = currentDate.getDate();
      nextDate.setMonth(nextDate.getMonth() + interval);

      // 월말 날짜 조정
      const daysInMonth = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate();
      if (targetDay > daysInMonth) {
        nextDate.setDate(daysInMonth);
      } else {
        nextDate.setDate(targetDay);
      }
      break;
    case 'yearly':
      // 매년 같은 날짜로 설정 (윤년 2월 29일 고려)
      nextDate.setFullYear(nextDate.getFullYear() + interval);

      // 윤년이 아닌 해의 2월 29일인 경우 2월 28일로 조정
      if (currentDate.getMonth() === 1 && currentDate.getDate() === 29) {
        const isLeapYear = (year: number) =>
          (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

        if (!isLeapYear(nextDate.getFullYear())) {
          nextDate.setDate(28);
        }
      }
      break;
  }

  return nextDate;
}

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷합니다.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * 반복 일정을 단일 일정으로 변환합니다.
 */
export function convertRepeatEventToSingle(event: Event): Event {
  return {
    ...event,
    isRepeatEvent: false,
    originalEventId: undefined,
    repeatEventIndex: undefined,
  };
}

/**
 * 반복 일정의 원본 일정을 찾습니다.
 */
export function findOriginalEvent(events: Event[], event: Event): Event | null {
  if (!event.originalEventId) return null;
  return events.find((e) => e.id === event.originalEventId) || null;
}

/**
 * 반복 일정의 모든 인스턴스를 찾습니다.
 */
export function findAllRepeatInstances(events: Event[], originalEventId: string): Event[] {
  return events.filter((event) => event.originalEventId === originalEventId);
}
