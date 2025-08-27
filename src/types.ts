export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface RepeatInfo {
  type: RepeatType;
  interval: number;
  endDate?: string;
}

export interface EventForm {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  location: string;
  category: string;
  repeat: RepeatInfo;
  notificationTime: number; // 분 단위로 저장
}

export interface Event extends EventForm {
  id: string;
  // 반복 일정 관련 필드들
  isRepeatEvent?: boolean; // 반복 일정 여부
  originalEventId?: string; // 원본 반복 일정 ID (반복 일정인 경우)
  repeatEventIndex?: number; // 반복 일정 중 몇 번째인지 (0부터 시작)
}
