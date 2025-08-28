import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, act, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import { setupMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';
import { server } from '../setupTests';
import { Event } from '../types';

const theme = createTheme();

const setup = (element: ReactElement) => {
  const user = userEvent.setup();

  return {
    ...render(
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{element}</SnackbarProvider>
      </ThemeProvider>
    ),
    user,
  };
};

const saveSchedule = async (
  user: UserEvent,
  form: Omit<Event, 'id' | 'notificationTime' | 'repeat'>
) => {
  const { title, date, startTime, endTime, location, description, category } = form;

  await user.click(screen.getByTestId('event-submit-button'));

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));
};

/**
 *
 * 첫번째 시나리오 : 기본 알림 워크플로우
 * 일정 생성: 사용자가 새로운 일정을 생성
 * 시간 진행: 가짜 타이머로 10분 전 시점으로 이동
 * 알림 표시: 정확한 메시지와 함께 알림 나타남
 *
 */

/*
 * 두번째 시나리오: 여러 알림 동시 처리
 * 중복 방지: 알림이 정확히 하나만 표시됨
 * 지속성 확인: 시간이 더 진행되어도 중복 생성되지 않음
 * 알림 닫기: X 버튼으로 알림 제거 가능
 * 상태 확인: 알림이 완전히 사라짐
 */

/**
 * 세 번째 시나리오 : 알림 시간 경계 테스트
 * 시간 변경: 이미 지난 시간으로 설정
 * 과거 일정 생성: 알림 시간이 이미 지난 일정 생성
 * 알림 미표시: 알림이 표시되지 않음
 * 지속적 확인: 시간이 더 진행되어도 알림 생성되지 않음
 */

describe('기본 알림 워크플로우', () => {
  afterEach(() => {
    // 타이머 정리
    vi.useRealTimers();
    server.resetHandlers();
  });

  it('사용자가 일정을 생성하고 알림 워크플로우가 정확히 작동하는지 확인한다', async () => {
    vi.useFakeTimers();

    // 첫번째 시나리오 : 기본 알림 워크플로우
    const eventStartTime = new Date('2025-10-15 09:00:00');
    const currentTime = new Date(eventStartTime.getTime() - 10 * 60 * 1000 - 1000); // 10분 1초 전
    vi.setSystemTime(currentTime);

    setupMockHandlerCreation();
    const { user } = setup(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('event-submit-button')).toBeInTheDocument();
    });

    await saveSchedule(user, {
      title: '중요한 회의',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '프로젝트 킥오프 미팅',
      location: '회의실 A',
      category: '업무',
    });

    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    expect(screen.queryByText(/10분 후.*중요한 회의.*일정이 시작됩니다/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000); // 1초 진행
    });

    await waitFor(() => {
      expect(screen.getByText('10분 후 중요한 회의 일정이 시작됩니다.')).toBeInTheDocument();
    });

    // 2. 알림이 정확히 하나만 표시되는지 확인 (중복 방지 테스트) -> 여러 알림 동시 처리
    const notifications = screen.getAllByText('10분 후 중요한 회의 일정이 시작됩니다.');
    expect(notifications).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(5000); // 5초 더 진행
    });

    const notificationsAfter = screen.getAllByText('10분 후 중요한 회의 일정이 시작됩니다.');
    expect(notificationsAfter).toHaveLength(1);

    const notificationAlert = screen
      .getByText('10분 후 중요한 회의 일정이 시작됩니다.')
      .closest('[role="alert"]') as HTMLElement;
    expect(notificationAlert).toBeInTheDocument();

    const closeButton = within(notificationAlert).getByRole('button');
    await user.click(closeButton);

    expect(screen.queryByText('10분 후 중요한 회의 일정이 시작됩니다.')).not.toBeInTheDocument();

    // 세 번째 시나리오: 알림 자동 만료

    const pastEventTime = new Date('2025-10-15 08:00:00'); // 이미 지난 시간
    const currentTimePast = new Date(pastEventTime.getTime() + 5 * 60 * 1000); // 5분 후
    vi.setSystemTime(currentTimePast);

    await saveSchedule(user, {
      title: '지난 미팅',
      date: '2025-10-15',
      startTime: '08:00',
      endTime: '09:00',
      description: '이미 끝난 미팅',
      location: '회의실 B',
      category: '업무',
    });

    await waitFor(() => {
      expect(screen.getByText('일정이 추가되었습니다.')).toBeInTheDocument();
    });

    expect(screen.queryByText(/10분 후.*지난 미팅.*일정이 시작됩니다/)).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2 * 60 * 1000); // 2분 더 진행
    });

    expect(screen.queryByText(/10분 후.*지난 미팅.*일정이 시작됩니다/)).not.toBeInTheDocument();
  });
});
