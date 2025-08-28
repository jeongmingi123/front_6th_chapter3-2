import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within, waitFor } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import { setupMockHandlerCreation } from '../__mocks__/handlersUtils';
import App from '../App';
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

  await waitFor(() => {
    expect(screen.getAllByText('일정 추가')[0]).toBeInTheDocument();
  });

  await user.click(screen.getAllByText('일정 추가')[0]);

  await waitFor(() => {
    expect(screen.getByLabelText('제목')).toBeInTheDocument();
  });

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);

  await waitFor(() => {
    expect(screen.getByLabelText('카테고리')).toBeInTheDocument();
  });

  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));

  await waitFor(() => {
    expect(screen.getByRole('option', { name: `${category}-option` })).toBeInTheDocument();
  });

  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  await user.click(screen.getByTestId('event-submit-button'));

  await waitFor(() => {
    const notifications = screen.getAllByText('일정이 추가되었습니다.');
    expect(notifications.length).toBeGreaterThan(0);
  });
};

/**
 * 뷰 간 데이터 동기화 및 날짜 네비게이션 테스트
 *
 * 첫 번째 시나리오: 뷰 간 데이터 동기화
 * - 일정 생성 후 주간 뷰에서 표시 확인
 * - 일정 리스트에서 동일한 일정 표시 확인
 * - 뷰 전환 시 데이터 일관성 유지 확인
 * - 여러 일정의 동기화 확인
 *
 * 두 번째 시나리오: 날짜 네비게이션
 * - 현재 주에 일정을 생성하고 다음 주로 이동합니다
 * - 다음 주에서는 일정이 표시되지 않는지 확인합니다
 * - 이전 주로 돌아가면 일정이 다시 표시되는지 확인합니다
 * - 여러 주에 걸친 일정들의 올바른 필터링 확인
 */

describe('뷰 간 데이터 동기화 테스트', () => {
  it('일정을 생성한 후 주간 뷰와 일정 리스트에서 모두 동일한 일정이 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const testEvent = {
      title: '중요한 회의',
      date: '2025-10-02',
      startTime: '14:00',
      endTime: '15:30',
      description: '프로젝트 킥오프 미팅',
      location: '회의실 B',
      category: '업무',
    };

    await saveSchedule(user, testEvent);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText(testEvent.title)).toBeInTheDocument();

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const secondWeekView = within(screen.getByTestId('week-view'));
    expect(secondWeekView.getByText(testEvent.title)).toBeInTheDocument();

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    expect(eventList.getByText(testEvent.date)).toBeInTheDocument();
    expect(
      eventList.getByText(`${testEvent.startTime} - ${testEvent.endTime}`)
    ).toBeInTheDocument();
    expect(eventList.getByText(testEvent.description)).toBeInTheDocument();
    expect(eventList.getByText(testEvent.location)).toBeInTheDocument();
    expect(eventList.getByText(`카테고리: ${testEvent.category}`)).toBeInTheDocument();

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const finalWeekView = within(screen.getByTestId('week-view'));
    expect(finalWeekView.getByText(testEvent.title)).toBeInTheDocument();
  });

  it('여러 일정을 생성한 후 주간 뷰와 일정 리스트에서 모든 일정이 정확히 동기화된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const firstEvent = {
      title: '아침 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '일일 스탠드업',
      location: '회의실 A',
      category: '업무',
    };

    await saveSchedule(user, firstEvent);

    const secondEvent = {
      title: '점심 약속',
      date: '2025-10-02',
      startTime: '12:00',
      endTime: '13:00',
      description: '팀 점심',
      location: '식당',
      category: '업무',
    };

    await saveSchedule(user, secondEvent);

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const weekView = within(screen.getByTestId('week-view'));
    expect(weekView.getByText(firstEvent.title)).toBeInTheDocument();
    expect(weekView.getByText(secondEvent.title)).toBeInTheDocument();

    await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
    await user.click(screen.getByRole('option', { name: 'week-option' }));

    const secondWeekView = within(screen.getByTestId('week-view'));
    expect(secondWeekView.getByText(firstEvent.title)).toBeInTheDocument();
    expect(secondWeekView.getByText(secondEvent.title)).toBeInTheDocument();

    const eventList = within(screen.getByTestId('event-list'));
    expect(eventList.getByText(firstEvent.title)).toBeInTheDocument();
    expect(eventList.getByText(secondEvent.title)).toBeInTheDocument();
  });

  it('일정 생성 후 주간 뷰 반복 전환 시에도 일정 데이터의 일관성이 유지된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const testEvent = {
      title: '데이터 동기화 테스트',
      date: '2025-10-02',
      startTime: '16:00',
      endTime: '17:00',
      description: '뷰 간 동기화 확인',
      location: '테스트룸',
      category: '업무',
    };

    await saveSchedule(user, testEvent);

    for (let i = 0; i < 3; i++) {
      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const weekView = within(screen.getByTestId('week-view'));
      expect(weekView.getByText(testEvent.title)).toBeInTheDocument();

      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    }
  });
  /**
   * 네비게이션 버튼: aria-label="Next", aria-label="Previous" 사용
   * 날짜 필터링: 주간 뷰에서 해당 주의 일정만 표시
   * 일정 리스트 동기화: 주간 뷰와 일정 리스트 간 필터링 동기화
   * 상태 일관성: 네비게이션 후에도 데이터 일관성 유지
   * 다중 일정 관리: 여러 주에 걸친 일정들의 올바른 분리 표시
   */

  describe('날짜 네비게이션 테스트', () => {
    it('현재 주에 일정을 생성하고 다음 주로 이동하면 일정이 사라지고, 이전 주로 돌아가면 다시 나타난다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      const testEvent = {
        title: '현재 주 회의',
        date: '2025-10-02',
        startTime: '14:00',
        endTime: '15:00',
        description: '현재 주 테스트 일정',
        location: '회의실 A',
        category: '업무',
      };

      await saveSchedule(user, testEvent);

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const currentWeekView = within(screen.getByTestId('week-view'));
      expect(currentWeekView.getByText(testEvent.title)).toBeInTheDocument();

      await user.click(screen.getByLabelText('Next'));

      const nextWeekView = within(screen.getByTestId('week-view'));
      expect(nextWeekView.queryByText(testEvent.title)).not.toBeInTheDocument();

      const eventListNext = within(screen.getByTestId('event-list'));
      expect(eventListNext.queryByText(testEvent.title)).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Previous'));

      const backToCurrentWeekView = within(screen.getByTestId('week-view'));
      expect(backToCurrentWeekView.getByText(testEvent.title)).toBeInTheDocument();

      const eventListBack = within(screen.getByTestId('event-list'));
      expect(eventListBack.getByText(testEvent.title)).toBeInTheDocument();
    });

    it('여러 주에 걸친 일정들이 날짜 네비게이션에 따라 올바르게 필터링된다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      const currentWeekEvent = {
        title: '현재 주 일정',
        date: '2025-10-02',
        startTime: '10:00',
        endTime: '11:00',
        description: '현재 주 테스트',
        location: '장소 A',
        category: '업무',
      };

      await saveSchedule(user, currentWeekEvent);

      const nextWeekEvent = {
        title: '다음 주 일정',
        date: '2025-10-09',
        startTime: '14:00',
        endTime: '15:00',
        description: '다음 주 테스트',
        location: '장소 B',
        category: '업무',
      };

      await saveSchedule(user, nextWeekEvent);

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      const currentWeekView = within(screen.getByTestId('week-view'));
      expect(currentWeekView.getByText(currentWeekEvent.title)).toBeInTheDocument();
      expect(currentWeekView.queryByText(nextWeekEvent.title)).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Next'));

      const nextWeekView = within(screen.getByTestId('week-view'));
      expect(nextWeekView.getByText(nextWeekEvent.title)).toBeInTheDocument();
      expect(nextWeekView.queryByText(currentWeekEvent.title)).not.toBeInTheDocument();

      await user.click(screen.getByLabelText('Previous'));

      const backWeekView = within(screen.getByTestId('week-view'));
      expect(backWeekView.getByText(currentWeekEvent.title)).toBeInTheDocument();
      expect(backWeekView.queryByText(nextWeekEvent.title)).not.toBeInTheDocument();
    });
  });

  describe('뷰 전환 시 날짜 유지 테스트', () => {
    it('주간 뷰에서 특정 날짜를 확인하고 월간 뷰로 전환해도 동일한 날짜가 표시된다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 10월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 1주')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 9월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekViewAgain = within(screen.getByTestId('week-view'));
        expect(weekViewAgain.getByText('2025년 10월 1주')).toBeInTheDocument();
      });
    });

    it('다음 주로 이동한 후 뷰를 전환해도 이동한 날짜가 유지된다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 1주')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Next'));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 2주')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 10월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekViewAgain = within(screen.getByTestId('week-view'));
        expect(weekViewAgain.getByText('2025년 10월 2주')).toBeInTheDocument();
      });
    });

    it('월간 뷰에서 다음 달로 이동한 후 주간 뷰로 전환해도 이동한 날짜가 유지된다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 10월')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Next'));

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 11월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 5주')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      await waitFor(() => {
        const monthViewAgain = within(screen.getByTestId('month-view'));
        expect(monthViewAgain.getByText('2025년 10월')).toBeInTheDocument();
      });
    });

    it('여러 번의 뷰 전환과 날짜 이동을 반복해도 날짜 상태가 일관성 있게 유지된다', async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 10월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 1주')).toBeInTheDocument();
      });

      await user.click(screen.getByLabelText('Next'));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 2주')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'month-option' }));

      await waitFor(() => {
        const monthView = within(screen.getByTestId('month-view'));
        expect(monthView.getByText('2025년 10월')).toBeInTheDocument();
      });

      await user.click(within(screen.getByLabelText('뷰 타입 선택')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: 'week-option' }));

      await waitFor(() => {
        const weekView = within(screen.getByTestId('week-view'));
        expect(weekView.getByText('2025년 10월 2주')).toBeInTheDocument();
      });
    });
  });
});
