import { differenceInCalendarDays } from 'date-fns';

export const isExpireInWeek = (expireDate: string): boolean => {
  const diff = differenceInCalendarDays(new Date(expireDate), new Date());
  return diff <= 7 && diff >= 0;
};
