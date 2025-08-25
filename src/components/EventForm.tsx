import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useState } from 'react';

import { Event, RepeatType } from '../types';
import { getTimeErrorMessage } from '../utils/timeValidation';

const categories = ['업무', '개인', '가족', '기타'];

const notificationOptions = [
  { value: 1, label: '1분 전' },
  { value: 10, label: '10분 전' },
  { value: 60, label: '1시간 전' },
  { value: 120, label: '2시간 전' },
  { value: 1440, label: '1일 전' },
];

interface EventFormProps {
  editingEvent: Event | null;
  onSubmit: (eventData: Event) => void;
  onCancel: () => void;
}

export function EventForm({ editingEvent, onSubmit, onCancel }: EventFormProps) {
  const [title, setTitle] = useState(editingEvent?.title || '');
  const [date, setDate] = useState(editingEvent?.date || '');
  const [startTime, setStartTime] = useState(editingEvent?.startTime || '');
  const [endTime, setEndTime] = useState(editingEvent?.endTime || '');
  const [description, setDescription] = useState(editingEvent?.description || '');
  const [location, setLocation] = useState(editingEvent?.location || '');
  const [category, setCategory] = useState(editingEvent?.category || '업무');
  const [isRepeating, setIsRepeating] = useState(editingEvent?.repeat.type !== 'none');
  const [repeatType, setRepeatType] = useState<RepeatType>(editingEvent?.repeat.type || 'daily');
  const [repeatInterval, setRepeatInterval] = useState(editingEvent?.repeat.interval || 1);
  const [repeatEndDate, setRepeatEndDate] = useState(editingEvent?.repeat.endDate || '');
  const [notificationTime, setNotificationTime] = useState(editingEvent?.notificationTime || 10);

  const [startTimeError, setStartTimeError] = useState('');
  const [endTimeError, setEndTimeError] = useState('');

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStartTime(value);
    if (endTime && value >= endTime) {
      setStartTimeError('시작 시간은 종료 시간보다 빨라야 합니다.');
    } else {
      setStartTimeError('');
    }
  };

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEndTime(value);
    if (startTime && value <= startTime) {
      setEndTimeError('종료 시간은 시작 시간보다 늦어야 합니다.');
    } else {
      setEndTimeError('');
    }
  };

  const validateTime = () => {
    const result = getTimeErrorMessage(startTime, endTime);
    setStartTimeError(result.startTimeError || '');
    setEndTimeError(result.endTimeError || '');
  };

  const handleSubmit = () => {
    if (!title || !date || !startTime || !endTime) {
      return false;
    }

    if (startTimeError || endTimeError) {
      return false;
    }

    const eventData: Event = {
      id: editingEvent?.id || '',
      title,
      date,
      startTime,
      endTime,
      description,
      location,
      category,
      repeat: {
        type: isRepeating ? repeatType : 'none',
        interval: repeatInterval,
        endDate: repeatEndDate || undefined,
      },
      notificationTime,
    };

    onSubmit(eventData);
    return true;
  };

  const resetForm = () => {
    setTitle('');
    setDate('');
    setStartTime('');
    setEndTime('');
    setDescription('');
    setLocation('');
    setCategory('업무');
    setIsRepeating(false);
    setRepeatType('daily');
    setRepeatInterval(1);
    setRepeatEndDate('');
    setNotificationTime(10);
    setStartTimeError('');
    setEndTimeError('');
  };

  return (
    <Stack spacing={2} sx={{ width: '20%' }}>
      <Typography variant="h4">{editingEvent ? '일정 수정' : '일정 추가'}</Typography>

      <FormControl fullWidth>
        <FormLabel htmlFor="title">제목</FormLabel>
        <TextField
          id="title"
          size="small"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="date">날짜</FormLabel>
        <TextField
          id="date"
          size="small"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </FormControl>

      <Stack direction="row" spacing={2}>
        <FormControl fullWidth>
          <FormLabel htmlFor="start-time">시작 시간</FormLabel>
          <Tooltip title={startTimeError || ''} open={!!startTimeError} placement="top">
            <TextField
              id="start-time"
              size="small"
              type="time"
              value={startTime}
              onChange={handleStartTimeChange}
              onBlur={validateTime}
              error={!!startTimeError}
            />
          </Tooltip>
        </FormControl>
        <FormControl fullWidth>
          <FormLabel htmlFor="end-time">종료 시간</FormLabel>
          <Tooltip title={endTimeError || ''} open={!!endTimeError} placement="top">
            <TextField
              id="end-time"
              size="small"
              type="time"
              value={endTime}
              onChange={handleEndTimeChange}
              onBlur={validateTime}
              error={!!endTimeError}
            />
          </Tooltip>
        </FormControl>
      </Stack>

      <FormControl fullWidth>
        <FormLabel htmlFor="description">설명</FormLabel>
        <TextField
          id="description"
          size="small"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="location">위치</FormLabel>
        <TextField
          id="location"
          size="small"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel id="category-label">카테고리</FormLabel>
        <Select
          id="category"
          size="small"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-labelledby="category-label"
          aria-label="카테고리"
        >
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat} aria-label={`${cat}-option`}>
              {cat}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl>
        <FormControlLabel
          control={
            <Checkbox checked={isRepeating} onChange={(e) => setIsRepeating(e.target.checked)} />
          }
          label="반복 일정"
        />
      </FormControl>

      <FormControl fullWidth>
        <FormLabel htmlFor="notification">알림 설정</FormLabel>
        <Select
          id="notification"
          size="small"
          value={notificationTime}
          onChange={(e) => setNotificationTime(Number(e.target.value))}
        >
          {notificationOptions.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isRepeating && (
        <Stack spacing={2}>
          <FormControl fullWidth>
            <FormLabel>반복 유형</FormLabel>
            <Select
              size="small"
              value={repeatType}
              onChange={(e) => setRepeatType(e.target.value as RepeatType)}
            >
              <MenuItem value="daily">매일</MenuItem>
              <MenuItem value="weekly">매주</MenuItem>
              <MenuItem value="monthly">매월</MenuItem>
              <MenuItem value="yearly">매년</MenuItem>
            </Select>
          </FormControl>
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <FormLabel>반복 간격</FormLabel>
              <TextField
                size="small"
                type="number"
                value={repeatInterval}
                onChange={(e) => setRepeatInterval(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 1 } }}
              />
            </FormControl>
            <FormControl fullWidth>
              <FormLabel>반복 종료일</FormLabel>
              <TextField
                size="small"
                type="date"
                value={repeatEndDate}
                onChange={(e) => setRepeatEndDate(e.target.value)}
              />
            </FormControl>
          </Stack>
        </Stack>
      )}

      <Stack direction="row" spacing={2}>
        <Button
          data-testid="event-submit-button"
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          fullWidth
        >
          {editingEvent ? '일정 수정' : '일정 추가'}
        </Button>
        {editingEvent && (
          <Button onClick={onCancel} variant="outlined" fullWidth>
            취소
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
