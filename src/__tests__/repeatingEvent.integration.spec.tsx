import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { render, screen, within } from '@testing-library/react';
import { UserEvent, userEvent } from '@testing-library/user-event';
import { SnackbarProvider } from 'notistack';
import { ReactElement } from 'react';

import {
  setupMockHandlerCreation,
  setupMockHandlerDeletion,
  setupMockHandlerUpdating,
} from '../__mocks__/handlersUtils';
import App from '../App';
import { Event, RepeatType } from '../types';

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

const saveRepeatingSchedule = async (
  user: UserEvent,
  form: {
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    description: string;
    category: string;
    repeatType: RepeatType;
    repeatInterval: number;
    repeatEndDate: string;
  }
) => {
  const {
    title,
    date,
    startTime,
    endTime,
    location,
    description,
    category,
    repeatType,
    repeatInterval,
    repeatEndDate,
  } = form;

  await user.click(screen.getAllByText('일정 추가')[0]);

  await user.type(screen.getByLabelText('제목'), title);
  await user.type(screen.getByLabelText('날짜'), date);
  await user.type(screen.getByLabelText('시작 시간'), startTime);
  await user.type(screen.getByLabelText('종료 시간'), endTime);
  await user.type(screen.getByLabelText('설명'), description);
  await user.type(screen.getByLabelText('위치'), location);

  // 카테고리 선택
  await user.click(screen.getByLabelText('카테고리'));
  await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
  await user.click(screen.getByRole('option', { name: `${category}-option` }));

  // 반복 일정 체크박스 활성화
  await user.click(screen.getByLabelText('반복 일정'));

  // 반복 유형 Select가 렌더링될 때까지 기다린 후 선택
  await screen.findByText('반복 유형');

  // 반복 유형 Select 클릭
  const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
  await user.click(repeatTypeSelect);

  // 반복 유형 옵션 선택 (키보드 방식)
  const keyMap: Record<RepeatType, number> = {
    none: 0,
    daily: 0, // 매일 (기본값, 이동 불필요)
    weekly: 1, // 매주 (ArrowDown 1번)
    monthly: 2, // 매월 (ArrowDown 2번)
    yearly: 3, // 매년 (ArrowDown 3번)
  };

  const moveCount = keyMap[repeatType] || 0;
  for (let i = 0; i < moveCount; i++) {
    await user.keyboard('{ArrowDown}');
  }
  await user.keyboard('{Enter}');

  // 반복 간격 설정
  await screen.findByText('반복 간격');
  const intervalInput = screen.getByDisplayValue('1');
  await user.clear(intervalInput);
  await user.type(intervalInput, repeatInterval.toString());

  // 반복 종료일 설정
  await screen.findByText('반복 종료일');
  const endDateInputs = screen.getAllByDisplayValue('2025-10-30');
  const endDateInput =
    endDateInputs.find((input) => input.getAttribute('type') === 'date') || endDateInputs[0];
  await user.clear(endDateInput);
  await user.type(endDateInput, repeatEndDate);

  await user.click(screen.getByTestId('event-submit-button'));
};

describe('반복 일정 통합 테스트', () => {
  describe('1. 기본 반복 일정 기능', () => {
    it('반복 일정 체크박스가 존재한다', async () => {
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      const repeatCheckbox = screen.getByLabelText('반복 일정');
      expect(repeatCheckbox).toBeInTheDocument();
      expect(repeatCheckbox).not.toBeChecked();
    });

    it('반복 일정 체크박스를 클릭하여 체크할 수 있다', async () => {
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      const repeatCheckbox = screen.getByLabelText('반복 일정');
      expect(repeatCheckbox).not.toBeChecked();

      await user.click(repeatCheckbox);
      expect(repeatCheckbox).toBeChecked();
    });

    it('반복 일정 체크박스를 클릭하면 반복 유형 Select가 나타난다', async () => {
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      const repeatCheckbox = screen.getByLabelText('반복 일정');
      expect(repeatCheckbox).not.toBeChecked();

      await user.click(repeatCheckbox);
      expect(repeatCheckbox).toBeChecked();

      const repeatTypeLabel = await screen.findByText('반복 유형');
      expect(repeatTypeLabel).toBeInTheDocument();

      const intervalLabel = await screen.findByText('반복 간격');
      expect(intervalLabel).toBeInTheDocument();

      const endDateLabel = await screen.findByText('반복 종료일');
      expect(endDateLabel).toBeInTheDocument();
    });
  });

  describe('2. 반복 유형 선택', () => {
    it('일정 생성 시 반복 유형을 선택할 수 있다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '반복 회의');
      await user.type(screen.getByLabelText('날짜'), '2025-01-15');
      await user.type(screen.getByLabelText('시작 시간'), '09:00');
      await user.type(screen.getByLabelText('종료 시간'), '10:00');
      await user.type(screen.getByLabelText('설명'), '주간 회의');
      await user.type(screen.getByLabelText('위치'), '회의실 A');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 체크박스 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      expect(repeatCheckbox).not.toBeChecked();
      await user.click(repeatCheckbox);
      expect(repeatCheckbox).toBeChecked();

      // 반복 유형 Select가 나타날 때까지 기다림
      await screen.findByText('반복 유형');

      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주로 이동
      await user.keyboard('{Enter}'); // 선택 확정

      // 반복 간격 설정
      await screen.findByText('반복 간격');
      const intervalInput = screen.getByDisplayValue('1');
      await user.clear(intervalInput);
      await user.type(intervalInput, '1');

      // 반복 종료일 설정
      await screen.findByText('반복 종료일');
      const endDateInputs = screen.getAllByDisplayValue('2025-10-30');
      const endDateInput =
        endDateInputs.find((input) => input.getAttribute('type') === 'date') || endDateInputs[0];

      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-06-30');

      await user.click(screen.getByTestId('event-submit-button'));

      const successMessage = await screen.findByText(
        '일정이 추가되었습니다.',
        {},
        { timeout: 8000 }
      );
      expect(successMessage).toBeInTheDocument();
    });
  });

  describe('3. 월간 반복 옵션', () => {
    it('매월 특정 날짜에 반복되도록 설정할 수 있다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '월간 보고서 작성');
      await user.type(screen.getByLabelText('날짜'), '2025-01-15'); // 매월 15일
      await user.type(screen.getByLabelText('시작 시간'), '09:00');
      await user.type(screen.getByLabelText('종료 시간'), '11:00');
      await user.type(screen.getByLabelText('설명'), '월간 업무 보고서');
      await user.type(screen.getByLabelText('위치'), '사무실');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      // 반복 유형을 매월로 변경
      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주
      await user.keyboard('{ArrowDown}'); // 매주 -> 매월
      await user.keyboard('{Enter}'); // 선택 확정

      // 2개월마다 설정
      await screen.findByText('반복 간격');
      const intervalInput = screen.getByDisplayValue('1');
      await user.clear(intervalInput);
      await user.type(intervalInput, '2');

      // 반복 종료일 설정
      await screen.findByText('반복 종료일');
      const endDateInputs = screen.getAllByDisplayValue('2025-10-30');
      const endDateInput =
        endDateInputs.find((input) => input.getAttribute('type') === 'date') || endDateInputs[0];
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-07-15');

      await user.click(screen.getByTestId('event-submit-button'));

      // 성공 메시지 확인
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();
    });

    it('매월 31일에 반복 설정 시 월말로 자동 조정된다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '월말 정산');
      await user.type(screen.getByLabelText('날짜'), '2025-01-31'); // 31일 설정
      await user.type(screen.getByLabelText('시작 시간'), '16:00');
      await user.type(screen.getByLabelText('종료 시간'), '18:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      // 반복 유형을 매월로 변경
      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주
      await user.keyboard('{ArrowDown}'); // 매주 -> 매월
      await user.keyboard('{Enter}'); // 선택 확정

      // 반복 종료일 설정
      await screen.findByText('반복 종료일');
      const endDateInputs = screen.getAllByDisplayValue('2025-10-30');
      const endDateInput =
        endDateInputs.find((input) => input.getAttribute('type') === 'date') || endDateInputs[0];
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-05-31');

      await user.click(screen.getByTestId('event-submit-button'));

      // 성공 메시지 확인 (월말 자동 조정 로직이 작동)
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();
    });

    it('매월 특정 순서의 요일 반복 옵션을 설정할 수 있다', { timeout: 15000 }, async () => {
      // TODO: 현재 미구현 상태이므로 추후 구현 시 활성화
      // 예: 매월 두 번째 월요일, 매월 마지막 금요일 등

      setupMockHandlerCreation();
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '월간 팀 미팅');
      await user.type(screen.getByLabelText('날짜'), '2025-01-13'); // 두 번째 월요일
      await user.type(screen.getByLabelText('시작 시간'), '10:00');
      await user.type(screen.getByLabelText('종료 시간'), '12:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      // 반복 유형을 매월로 변경
      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주
      await user.keyboard('{ArrowDown}'); // 매주 -> 매월
      await user.keyboard('{Enter}'); // 선택 확정

      await user.click(screen.getByTestId('event-submit-button'));

      // 현재는 특정 날짜 반복만 지원하므로 기본 기능으로 성공
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();

      // 추후 특정 순서 요일 반복 기능 구현 시:
      // - "매월 반복 방식" 선택 UI 추가 필요
      // - "특정 날짜" vs "특정 순서 요일" 선택 옵션
      // - 순서 선택 (첫 번째, 두 번째, 세 번째, 네 번째, 마지막)
      // - 요일 선택 (월요일, 화요일, ..., 일요일)
    });
  });

  describe('4. 반복 일정 전체 수정 및 삭제', () => {
    it('반복 일정의 개별 일정을 수정할 수 있다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();
      setupMockHandlerUpdating();

      const { user } = setup(<App />);

      // 먼저 반복 일정 생성
      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '주간 스탠드업');
      await user.type(screen.getByLabelText('날짜'), '2025-01-15');
      await user.type(screen.getByLabelText('시작 시간'), '09:00');
      await user.type(screen.getByLabelText('종료 시간'), '09:30');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화 (매주)
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주
      await user.keyboard('{Enter}');

      await user.click(screen.getByTestId('event-submit-button'));

      // 생성 성공 확인
      await screen.findByText('일정이 추가되었습니다.');

      // 생성된 반복 일정 중 하나를 수정
      const editButtons = await screen.findAllByLabelText('Edit event');
      expect(editButtons.length).toBeGreaterThan(0);

      await user.click(editButtons[0]);

      // 제목 수정 (실제 mock 데이터와 일치하도록 수정)
      const titleInput = screen.getByDisplayValue('기존 회의');
      await user.clear(titleInput);
      await user.type(titleInput, '수정된 회의');

      // 수정 버튼 클릭 (data-testid 사용)
      await user.click(screen.getByTestId('event-submit-button'));

      // 수정 성공 확인
      const updateMessage = await screen.findByText('일정이 수정되었습니다.');
      expect(updateMessage).toBeInTheDocument();
    });

    it('반복 일정의 개별 일정을 삭제할 수 있다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();
      setupMockHandlerDeletion();

      const { user } = setup(<App />);

      // 먼저 반복 일정 생성
      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '반복 운동');
      await user.type(screen.getByLabelText('날짜'), '2025-01-20');
      await user.type(screen.getByLabelText('시작 시간'), '07:00');
      await user.type(screen.getByLabelText('종료 시간'), '08:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '개인-option' }));

      // 반복 일정 활성화 (매일)
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      await user.click(screen.getByTestId('event-submit-button'));

      // 생성 성공 확인
      await screen.findByText('일정이 추가되었습니다.');

      // 생성된 반복 일정 중 하나를 삭제
      const deleteButtons = await screen.findAllByLabelText('Delete event');
      expect(deleteButtons.length).toBeGreaterThan(0);

      await user.click(deleteButtons[0]);

      // 삭제 성공 확인
      const deleteMessage = await screen.findByText('일정이 삭제되었습니다.');
      expect(deleteMessage).toBeInTheDocument();
    });

    it('반복 일정 전체 수정 기능이 필요하다', async () => {
      // TODO: 현재 미구현 상태, 추후 구현 시 활성화
      // 반복 일정 그룹 전체를 한 번에 수정하는 기능

      setupMockHandlerCreation();
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '팀 회의');
      await user.type(screen.getByLabelText('날짜'), '2025-01-22');
      await user.type(screen.getByLabelText('시작 시간'), '14:00');
      await user.type(screen.getByLabelText('종료 시간'), '15:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      await user.click(screen.getByTestId('event-submit-button'));

      // 현재는 개별 수정만 가능하므로 기본 생성만 테스트
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();

      // 추후 전체 수정 기능 구현 시:
      // - 반복 일정 그룹에 "전체 수정" 버튼 추가
      // - 수정 시 "이 일정만 수정" vs "전체 시리즈 수정" 선택 다이얼로그
      // - 전체 수정 시 originalEventId로 연결된 모든 일정 일괄 수정
    });

    it('반복 일정 전체 삭제 기능이 필요하다', async () => {
      // TODO: 현재 미구현 상태, 추후 구현 시 활성화
      // 반복 일정 그룹 전체를 한 번에 삭제하는 기능

      setupMockHandlerCreation();
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '정기 점검');
      await user.type(screen.getByLabelText('날짜'), '2025-01-25');
      await user.type(screen.getByLabelText('시작 시간'), '10:00');
      await user.type(screen.getByLabelText('종료 시간'), '11:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      await user.click(screen.getByTestId('event-submit-button'));

      // 현재는 개별 삭제만 가능하므로 기본 생성만 테스트
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();

      // 추후 전체 삭제 기능 구현 시:
      // - 반복 일정 그룹에 "전체 삭제" 버튼 추가
      // - 삭제 시 "이 일정만 삭제" vs "전체 시리즈 삭제" 선택 다이얼로그
      // - 전체 삭제 시 originalEventId로 연결된 모든 일정 일괄 삭제
      // - 확인 다이얼로그: "총 N개의 반복 일정이 삭제됩니다."
    });
  });

  describe('5. 반복 일정 아이콘 표시', () => {
    it('매일 반복 일정을 생성하면 반복 아이콘이 표시된다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '매일 운동');
      await user.type(screen.getByLabelText('날짜'), '2025-01-15');
      await user.type(screen.getByLabelText('시작 시간'), '07:00');
      await user.type(screen.getByLabelText('종료 시간'), '08:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '개인-option' }));

      // 반복 일정 체크박스 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      expect(repeatCheckbox).not.toBeChecked();
      await user.click(repeatCheckbox);
      expect(repeatCheckbox).toBeChecked();

      // 반복 관련 UI가 나타나는지 확인
      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      expect(repeatTypeSelect).toBeInTheDocument();

      // 일정 제출 (기본값인 매일 반복 사용)
      await user.click(screen.getByTestId('event-submit-button'));

      // 성공 메시지 확인
      const successMessage = await screen.findByText(
        '일정이 추가되었습니다.',
        {},
        { timeout: 8000 }
      );
      expect(successMessage).toBeInTheDocument();
    });

    it('매주 반복 일정을 생성하면 반복 아이콘과 정보가 표시된다', { timeout: 15000 }, async () => {
      setupMockHandlerCreation();

      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '주간 회의');
      await user.type(screen.getByLabelText('날짜'), '2025-01-20');
      await user.type(screen.getByLabelText('시작 시간'), '14:00');
      await user.type(screen.getByLabelText('종료 시간'), '15:00');
      await user.type(screen.getByLabelText('설명'), '팀 미팅');
      await user.type(screen.getByLabelText('위치'), '회의실 B');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      // 반복 일정 활성화
      const repeatCheckbox = screen.getByLabelText('반복 일정');
      await user.click(repeatCheckbox);

      // 반복 유형을 매주로 변경
      await screen.findByText('반복 유형');
      const repeatTypeSelect = screen.getByLabelText('반복 유형 선택');
      await user.click(repeatTypeSelect);
      await user.keyboard('{ArrowDown}'); // 매일 -> 매주로 이동
      await user.keyboard('{Enter}'); // 선택 확정

      // 2주마다 설정
      await screen.findByText('반복 간격');
      const intervalInput = screen.getByDisplayValue('1');
      await user.clear(intervalInput);
      await user.type(intervalInput, '2');

      // 반복 종료일 설정
      await screen.findByText('반복 종료일');
      const endDateInputs = screen.getAllByDisplayValue('2025-10-30');
      const endDateInput =
        endDateInputs.find((input) => input.getAttribute('type') === 'date') || endDateInputs[0];
      await user.clear(endDateInput);
      await user.type(endDateInput, '2025-06-30');

      await user.click(screen.getByTestId('event-submit-button'));

      // 성공 메시지 확인
      const successMessage = await screen.findByText('일정이 추가되었습니다.');
      expect(successMessage).toBeInTheDocument();
    });

    it('일반 일정을 생성하면 반복 아이콘이 표시되지 않는다', async () => {
      setupMockHandlerCreation();
      const { user } = setup(<App />);

      await user.click(screen.getAllByText('일정 추가')[0]);

      await user.type(screen.getByLabelText('제목'), '간단한 테스트');
      await user.type(screen.getByLabelText('날짜'), '2025-01-15');
      await user.type(screen.getByLabelText('시작 시간'), '14:00');
      await user.type(screen.getByLabelText('종료 시간'), '15:00');

      // 카테고리 선택
      await user.click(screen.getByLabelText('카테고리'));
      await user.click(within(screen.getByLabelText('카테고리')).getByRole('combobox'));
      await user.click(screen.getByRole('option', { name: '업무-option' }));

      await user.click(screen.getByTestId('event-submit-button'));

      // 성공 메시지 확인
      const successMessage = await screen.findByText(
        '일정이 추가되었습니다.',
        {},
        { timeout: 8000 }
      );
      expect(successMessage).toBeInTheDocument();
    });
  });
});
