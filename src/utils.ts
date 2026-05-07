import { differenceInMinutes, parseISO, startOfDay, addMinutes, format } from 'date-fns';

export function calculateHours(startStr: string, endStr: string) {
  if (!startStr || !endStr) return { diffMinutes: 0, formatted: '00:00' };
  
  const [startH, startM] = startStr.split(':').map(Number);
  const [endH, endM] = endStr.split(':').map(Number);
  
  const startDate = startOfDay(new Date());
  startDate.setHours(startH, startM);
  
  let endDate = startOfDay(new Date());
  endDate.setHours(endH, endM);
  
  if (endDate < startDate) {
    endDate = addMinutes(endDate, 24 * 60); // cross midnight
  }
  
  const diffMinutes = differenceInMinutes(endDate, startDate);
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  
  return {
    diffMinutes,
    formatted: `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  };
}

export function generateId() {
  return Math.random().toString(36).substr(2, 9);
}
