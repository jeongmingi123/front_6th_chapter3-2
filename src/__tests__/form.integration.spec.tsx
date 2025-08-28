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

  // 드롭다운이 열릴 때까지 기다린 후 옵션 선택
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

    // 먼저 일정을 생성
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

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    // 편집 버튼 클릭하여 편집 모드로 전환
    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    // 편집 모드에서 모든 폼 필드가 올바르게 로드되었는지 확인

    // 1. 제목 필드 확인
    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe(testEvent.title);

    // 2. 날짜 필드 확인
    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe(testEvent.date);

    // 3. 시작 시간 필드 확인
    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe(testEvent.startTime);

    // 4. 종료 시간 필드 확인
    const endTimeInput = screen.getByLabelText('종료 시간') as HTMLInputElement;
    expect(endTimeInput.value).toBe(testEvent.endTime);

    // 5. 설명 필드 확인
    const descriptionInput = screen.getByLabelText('설명') as HTMLInputElement;
    expect(descriptionInput.value).toBe(testEvent.description);

    // 6. 위치 필드 확인
    const locationInput = screen.getByLabelText('위치') as HTMLInputElement;
    expect(locationInput.value).toBe(testEvent.location);

    // 7. 카테고리 필드 확인
    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelect.textContent).toBe(testEvent.category);

    // 8. 알림 설정 확인 (기본값: 10분 전)
    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelect.textContent).toBe('10분 전');
  });

  it('기본 일정을 편집할 때 폼 필드가 올바르게 로드된다 (간단 버전)', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 기본 일정 생성
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

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    // 편집 버튼 클릭하여 편집 모드로 전환
    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    // 편집 모드에서 모든 필드가 올바르게 로드되었는지 확인
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

    // 반복 일정 체크박스가 체크되지 않았는지 확인 (기본 일정)
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    expect(repeatCheckbox.checked).toBe(false);
  });

  it('알림 설정이 다른 일정을 편집 모드로 전환했을 때 알림 설정이 올바르게 로드된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 일정 추가 폼 열기
    await user.click(screen.getAllByText('일정 추가')[0]);

    // 기본 정보 입력
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

    // 드롭다운이 열릴 때까지 기다린 후 옵션 선택
    await waitFor(() => {
      expect(screen.getByLabelText(`${testEvent.category}-option`)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(`${testEvent.category}-option`));

    // 알림 설정을 1시간 전으로 변경
    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    await user.click(notificationSelect);

    // 드롭다운이 열릴 때까지 기다린 후 옵션 선택
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '1시간 전' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: '1시간 전' }));

    // 일정 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    // 편집 버튼 클릭하여 편집 모드로 전환
    const eventList = within(screen.getByTestId('event-list'));
    const editButton = eventList.getByLabelText('Edit event');
    await user.click(editButton);

    // 편집 모드에서 알림 설정이 올바르게 로드되었는지 확인
    const notificationSelectEdit = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelectEdit.textContent).toBe('1시간 전');

    // 다른 모든 필드도 올바르게 로드되었는지 확인
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

    // 첫 번째 일정 생성
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

    // 두 번째 일정 생성
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

    // 두 일정이 모두 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(firstEvent.title)).toBeInTheDocument();
      expect(eventList.getByText(secondEvent.title)).toBeInTheDocument();
    });

    // 두 번째 일정의 편집 버튼 클릭 (두 번째 Edit 버튼)
    const eventList = within(screen.getByTestId('event-list'));
    const editButtons = eventList.getAllByLabelText('Edit event');
    await user.click(editButtons[1]); // 두 번째 일정의 편집 버튼

    // 편집 모드에서 두 번째 일정의 데이터가 올바르게 로드되었는지 확인
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

    // 첫 번째 일정의 데이터가 아닌 것을 확인
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

    // 일정 추가 폼 열기
    await user.click(screen.getAllByText('일정 추가')[0]);

    // 기본 정보 입력
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

    // 카테고리 선택
    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    await user.click(categorySelect);
    await waitFor(() => {
      expect(screen.getByLabelText(`${testEvent.category}-option`)).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText(`${testEvent.category}-option`));

    // 일정 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText(testEvent.title)).toBeInTheDocument();
    });

    // 폼이 초기화되었는지 확인
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

    // 카테고리가 기본값(첫 번째 옵션)으로 리셋되었는지 확인
    const categorySelectReset = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelectReset.textContent).toBe('업무'); // 첫 번째 옵션이 기본값

    // 알림 설정이 기본값으로 리셋되었는지 확인
    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelect.textContent).toBe('10분 전'); // 기본 알림 설정
  });

  it('알림 설정을 변경한 일정을 생성한 후 폼이 기본값으로 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 일정 추가 폼 열기
    await user.click(screen.getAllByText('일정 추가')[0]);

    // 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '알림 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-16');
    await user.type(screen.getByLabelText('시작 시간'), '15:00');
    await user.type(screen.getByLabelText('종료 시간'), '16:00');

    // 알림 설정을 2시간 전으로 변경
    const notificationSelect = document.getElementById('notification') as HTMLSelectElement;
    await user.click(notificationSelect);
    await waitFor(() => {
      expect(screen.getByRole('option', { name: '2시간 전' })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: '2시간 전' }));

    // 일정 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('알림 테스트')).toBeInTheDocument();
    });

    // 알림 설정이 기본값으로 리셋되었는지 확인
    const notificationSelectReset = document.getElementById('notification') as HTMLSelectElement;
    expect(notificationSelectReset.textContent).toBe('10분 전');

    // 다른 필드들도 초기화되었는지 확인
    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });

  it('카테고리를 변경한 일정을 생성한 후 폼이 기본값으로 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 일정 추가 폼 열기
    await user.click(screen.getAllByText('일정 추가')[0]);

    // 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '카테고리 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-17');
    await user.type(screen.getByLabelText('시작 시간'), '11:00');
    await user.type(screen.getByLabelText('종료 시간'), '12:00');

    // 카테고리를 '가족'으로 변경
    const categorySelect = document.getElementById('category') as HTMLSelectElement;
    await user.click(categorySelect);
    await waitFor(() => {
      expect(screen.getByLabelText('가족-option')).toBeInTheDocument();
    });
    await user.click(screen.getByLabelText('가족-option'));

    // 일정 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정이 생성되었는지 확인
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      expect(eventList.getByText('카테고리 테스트')).toBeInTheDocument();
    });

    // 카테고리가 기본값('업무')으로 리셋되었는지 확인
    const categorySelectReset = document.getElementById('category') as HTMLSelectElement;
    expect(categorySelectReset.textContent).toBe('업무');

    // 다른 필드들도 초기화되었는지 확인
    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const startTimeInput = screen.getByLabelText('시작 시간') as HTMLInputElement;
    expect(startTimeInput.value).toBe('');
  });

  it('반복 일정을 생성한 후 반복 설정이 비활성화되고 폼이 리셋된다', async () => {
    setupMockHandlerCreation();

    const { user } = setup(<App />);

    // 일정 추가 폼 열기
    await user.click(screen.getAllByText('일정 추가')[0]);

    // 기본 정보 입력
    await user.type(screen.getByLabelText('제목'), '반복 테스트');
    await user.type(screen.getByLabelText('날짜'), '2025-10-18');
    await user.type(screen.getByLabelText('시작 시간'), '13:00');
    await user.type(screen.getByLabelText('종료 시간'), '14:00');

    // 반복 일정 설정
    await user.click(screen.getByLabelText('반복 일정'));

    // 반복 설정 UI가 나타날 때까지 기다림
    await waitFor(() => {
      expect(screen.getByTestId('repeat-type-select')).toBeInTheDocument();
    });

    // 반복 종료 날짜 설정
    await waitFor(() => {
      expect(screen.getByTestId('repeat-end-date-input')).toBeInTheDocument();
    });
    const repeatEndDateInput = screen.getByTestId('repeat-end-date-input');
    await user.type(repeatEndDateInput, '2025-12-31');

    // 일정 저장
    await user.click(screen.getByTestId('event-submit-button'));

    // 일정이 생성되었는지 확인 (반복 일정이므로 여러 개의 일정이 생성될 수 있음)
    await waitFor(() => {
      const eventList = within(screen.getByTestId('event-list'));
      const eventTitles = eventList.getAllByText('반복 테스트');
      expect(eventTitles.length).toBeGreaterThan(0);
    });

    // 반복 일정 체크박스가 해제되었는지 확인
    const repeatCheckbox = screen.getByLabelText('반복 일정') as HTMLInputElement;
    expect(repeatCheckbox.checked).toBe(false);

    // 반복 설정 UI가 사라졌는지 확인 (체크박스가 해제되면 반복 설정 UI는 숨겨짐)
    expect(screen.queryByTestId('repeat-type-select')).not.toBeInTheDocument();
    expect(screen.queryByTestId('repeat-end-date-input')).not.toBeInTheDocument();

    // 기본 필드들이 초기화되었는지 확인
    const titleInput = screen.getByLabelText('제목') as HTMLInputElement;
    expect(titleInput.value).toBe('');

    const dateInput = screen.getByLabelText('날짜') as HTMLInputElement;
    expect(dateInput.value).toBe('');
  });
});
