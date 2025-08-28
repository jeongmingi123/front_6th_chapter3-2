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

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);
  const categorySelect = document.getElementById('category') as HTMLSelectElement;
  await user.click(categorySelect);

  await waitFor(() => {
    expect(screen.getByLabelText(`${category}-option`)).toBeInTheDocument();
  });
  await user.click(screen.getByLabelText(`${category}-option`));

  await user.click(screen.getByTestId('event-submit-button'));
};

/**
 * 편집 모드 폼 로딩 테스트
 *
 * 첫 번째 시나리오: 편집 모드 폼 로딩
 * - 기존 일정을 편집 모드로 전환했을 때 모든 폼 필드가 올바르게 로드되는지 확인합니다
 * - 제목, 날짜, 시간, 설명, 위치, 카테고리, 알림 설정이 모두 정확하게 표시되는지 확인합니다
 */

describe('편집 모드 폼 로딩 테스트', () => {
  it('기존 일정을 편집 모드로 전환했을 때 모든 폼 필드가 올바르게 로드된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const testEvent = {
      title: '회의 일정',
      date: '2025-10-02',
      startTime: '14:00',
      endTime: '15:30',
      description: '중요한 프로젝트 회의',
      location: '회의실 A',
      category: '업무',
    };

    await saveSchedule(user, testEvent);

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe(testEvent.title);

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe(testEvent.date);

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(testEvent.startTime);

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe(testEvent.endTime);

    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe(testEvent.description);

    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe(testEvent.location);

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelect.textContent).toBe(testEvent.category);

    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelect.textContent).toBe('10분 전');
  });

  it('기본 일정을 편집할 때 폼 필드가 올바르게 로드된다 (간단 버전)', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const testEvent = {
      title: '간단한 회의',
      date: '2025-10-03',
      startTime: '14:00',
      endTime: '15:00',
      description: '기본 일정 테스트',
      location: '회의실 C',
      category: '개인',
    };

    await saveSchedule(user, testEvent);

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe(testEvent.title);

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe(testEvent.date);

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(testEvent.startTime);

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe(testEvent.endTime);

    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe(testEvent.description);

    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe(testEvent.location);

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelect.textContent).toBe(testEvent.category);

    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    expect(repeatCheckbox.checked).toBe(false);
  });

  it('알림 설정이 다른 일정을 편집 모드로 전환했을 때 알림 설정이 올바르게 로드된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    const testEvent = {
      title: '점심 약속',
      date: '2025-10-03',
      startTime: '12:00',
      endTime: '13:00',
      description: '동료와 점심 식사',
      location: '레스토랑',
      category: '개인',
    };

    await user.type(screen.getByLabelText('제목'), testEvent.title);
    await user.type(screen.getByLabelText('날짜'), testEvent.date);
    await user.type(screen.getByLabelText('시작 시간'), testEvent.startTime);
    await user.type(screen.getByLabelText('종료 시간'), testEvent.endTime);
    await user.type(screen.getByLabelText('설명'), testEvent.description);
    await user.type(screen.getByLabelText('위치'), testEvent.location);
    const categorySelect2 = document.getElementById('category') as HTMLSelectElement;
    await user.click(categorySelect2);

    await waitFor(() => {
      expect(screen.getByLabelText(`${testEvent.category}-option`)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(`${testEvent.category}-option`));

    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    await user.click(notificationSelect);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1시간 전' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: '1시간 전' }));

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    const notificationSelectEdit = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelectEdit.textContent).toBe('1시간 전');

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe(testEvent.title);

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe(testEvent.date);

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(testEvent.startTime);

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe(testEvent.endTime);

    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe(testEvent.description);

    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe(testEvent.location);

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelect.textContent).toBe(testEvent.category);
  });

  it('여러 일정 중 특정 일정을 편집할 때 올바른 일정의 데이터가 로드된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const firstEvent = {
      title: '첫 번째 회의',
      date: '2025-10-02',
      startTime: '09:00',
      endTime: '10:00',
      description: '아침 회의',
      location: '회의실 1',
      category: '업무',
    };

    await saveSchedule(user, firstEvent);

    const secondEvent = {
      title: '두 번째 회의',
      date: '2025-10-02',
      startTime: '14:00',
      endTime: '15:00',
      description: '오후 회의',
      location: '회의실 2',
      category: '개인',
    };

    await saveSchedule(user, secondEvent);

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(firstEvent.title)).toBeInTheDocument();
      expect(eventList.getByText(secondEvent.title)).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const editButtons = eventList.getAllByLabelText('Edit event');
    await user.click(editButtons[1]);

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe(secondEvent.title);

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe(secondEvent.date);

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(secondEvent.startTime);

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe(secondEvent.endTime);

    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe(secondEvent.description);

    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe(secondEvent.location);

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelect.textContent).toBe(secondEvent.category);

    expect(titleInput.value).not.toBe(firstEvent.title);
    expect(startTimeInput.value).not.toBe(firstEvent.startTime);
    expect(descriptionInput.value).not.toBe(firstEvent.description);
    expect(locationInput.value).not.toBe(firstEvent.location);
  });
});

/**
 * 폼 제출 후 리셋 테스트
 *
 * 두 번째 시나리오: 폼 제출 후 리셋
 * - 새 일정을 생성하고 제출한 후 폼이 완전히 초기화되는지 확인합니다
 * - 모든 입력 필드가 비워지고 기본값들이 올바르게 설정되는지 확인합니다
 */

describe('폼 제출 후 리셋 테스트', () => {
  it('기본 일정을 생성한 후 폼이 초기화된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    const testEvent = {
      title: '테스트 일정',
      date: '2025-10-15',
      startTime: '09:00',
      endTime: '10:00',
      description: '폼 리셋 테스트용 일정',
      location: '테스트 장소',
      category: '업무',
    };

    await user.type(screen.getByLabelText('제목'), testEvent.title);
    await user.type(screen.getByLabelText('날짜'), testEvent.date);
    await user.type(screen.getByLabelText('시작 시간'), testEvent.startTime);
    await user.type(screen.getByLabelText('종료 시간'), testEvent.endTime);
    await user.type(screen.getByLabelText('설명'), testEvent.description);
    await user.type(screen.getByLabelText('위치'), testEvent.location);

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    await user.click(categorySelect);
    await waitFor(() => {
      expect(screen.getByLabelText(`${testEvent.category}-option`)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(`${testEvent.category}-option`));

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe('');

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe('');

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe('');

    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe('');

    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe('');

    const categorySelectReset = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelectReset.textContent).toBe('업무');

    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelect.textContent).toBe('10분 전');
  });

  it('알림 설정을 변경한 일정을 생성한 후 폼이 기본값으로 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '알림 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-16');
    await user.type(screen.getByLabelText('시작 시간'), '15:00');
    await user.type(screen.getByLabelText('종료 시간'), '16:00');

    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    await user.click(notificationSelect);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '2시간 전' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: '2시간 전' }));

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('알림 테스트')).toBeInTheDocument();
    });

    const notificationSelectReset = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelectReset.textContent).toBe('10분 전');

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });

  it('카테고리를 변경한 일정을 생성한 후 폼이 기본값으로 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '카테고리 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-17');
    await user.type(screen.getByLabelText('시작 시간'), '11:00');
    await user.type(screen.getByLabelText('종료 시간'), '12:00');

    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    await user.click(categorySelect);
    await waitFor(() => {
      expect(screen.getByLabelText('가족-option')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('가족-option'));

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('카테고리 테스트')).toBeInTheDocument();
    });

    const categorySelectReset = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelectReset.textContent).toBe('업무');

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe('');
  });

  it('반복 일정을 생성한 후 반복 설정이 비활성화되고 폼이 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '반복 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-18');
    await user.type(screen.getByLabelText('시작 시간'), '13:00');
    await user.type(screen.getByLabelText('종료 시간'), '14:00');

    await user.click(screen.getByLabelText('반복 일정'));

    await waitFor(() => {
      expect(screen.getByTestId('repeat-type-select')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByTestId('repeat-end-date-input')).toBeInTheDocument();
    });
    const repeatEndDateInput = screen.getByTestId('repeat-end-date-input');
    await user.type(repeatEndDateInput, '2025-12-31');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      const eventTitles = eventList.getAllByText('반복 테스트');
      expect(eventTitles.length).toBeGreaterThan(0);
    });

    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    expect(repeatCheckbox.checked).toBe(false);

    expect(screen.queryByTestId('repeat-type-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('repeat-end-date-input')).not.toBeInTheDocument();

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });
});

/**
 * 필수 필드 검증 테스트
 *
 * 세 번째 시나리오: 필수 필드 검증
 * - 필수 필드를 입력하지 않고 제출할 때 적절한 오류 메시지가 표시되는지 확인합니다
 * - 오류가 있을 때 일정이 저장되지 않는지 확인합니다
 */

describe('필수 필드 검증 테스트', () => {
  it('제목을 입력하지 않고 제출할 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('10:00')).toThrow();
  });

  it('날짜를 입력하지 않고 제출할 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '날짜 없는 일정');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('날짜 없는 일정')).toThrow();
  });

  it('시작 시간을 입력하지 않고 제출할 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '시간 없는 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('시간 없는 일정')).toThrow();
  });

  it('종료 시간을 입력하지 않고 제출할 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '종료시간 없는 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('종료시간 없는 일정')).toThrow();
  });

  it('여러 필수 필드를 입력하지 않고 제출할 때 오류가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const eventItems = eventList.queryAllByRole('button', { name: /Edit event/i });
    expect(eventItems.length).toBe(0);
  });

  it('필수 필드 오류 수정 후 정상적으로 일정이 저장된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '10:00');
    await user.type(screen.getByLabelText('종료 시간'), '11:00');
    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('필수 정보를 모두 입력해주세요.')).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText('제목'), '수정된 일정');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('수정된 일정')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });
});

/**
 * 시간 검증 테스트
 *
 * 네 번째 시나리오: 시간 검증
 * - 시작 시간이 종료 시간보다 늦을 때 적절한 오류 메시지가 표시되는지 확인합니다
 * - 시간 오류가 있을 때 일정이 저장되지 않는지 확인합니다
 * - 다양한 시간 형식과 경계 케이스에 대한 검증을 확인합니다
 */

describe('시간 검증 테스트', () => {
  it('시작 시간이 종료 시간보다 늦을 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '시간 오류 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '15:00');
    await user.type(screen.getByLabelText('종료 시간'), '14:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('시간 설정을 확인해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('시간 오류 테스트')).toThrow();
  });

  it('시작 시간과 종료 시간이 같을 때 오류 메시지가 표시되고 일정이 저장되지 않는다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '동일 시간 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '14:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('시간 설정을 확인해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('동일 시간 테스트')).toThrow();
  });

  it('자정을 넘어가는 시간 설정에서 오류가 발생한다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '자정 넘어가는 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '23:30');
    await user.type(screen.getByLabelText('종료 시간'), '01:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('시간 설정을 확인해주세요.')).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    expect(() => eventList.getByText('자정 넘어가는 일정')).toThrow();
  });

  it('1분 차이의 유효한 시간 설정은 정상적으로 저장된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '1분 차이 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '14:00');
    await user.type(screen.getByLabelText('종료 시간'), '14:01');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('1분 차이 일정')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('긴 시간의 유효한 일정은 정상적으로 저장된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '하루 종일 일정');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '09:00');
    await user.type(screen.getByLabelText('종료 시간'), '18:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('하루 종일 일정')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('시간 오류 수정 후 정상적으로 일정이 저장된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    await user.click(screen.getAllByText('일정 추가')[0]);

    await user.type(screen.getByLabelText('제목'), '시간 수정 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-20');
    await user.type(screen.getByLabelText('시작 시간'), '16:00');
    await user.type(screen.getByLabelText('종료 시간'), '15:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('시간 설정을 확인해주세요.')).toBeInTheDocument();
    });

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '17:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('시간 수정 테스트')).toBeInTheDocument();
    });

    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');
  });

  it('편집 모드에서 시간 오류가 발생하면 적절한 메시지가 표시된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    const testEvent = {
      title: '편집할 일정',
      date: '2025-10-20',
      startTime: '10:00',
      endTime: '11:00',
      description: '편집 테스트용',
      location: '테스트 장소',
      category: '업무',
    };

    await saveSchedule(user, testEvent);

    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    await user.clear(endTimeInput);
    await user.type(endTimeInput, '09:00');

    await user.click(screen.getByTestId('event-submit-button'));

    await waitFor(() => {
      expect(screen.getByText('시간 설정을 확인해주세요.')).toBeInTheDocument();
    });

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(testEvent.startTime);
    expect(endTimeInput.value).toBe('09:00');
  });
});
