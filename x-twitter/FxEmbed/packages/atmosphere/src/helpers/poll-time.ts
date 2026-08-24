export type PollTimeStrings = {
  singularDay: string;
  pluralDays: string;
  singularHour: string;
  pluralHours: string;
  singularMinute: string;
  pluralMinutes: string;
  singularSecond: string;
  pluralSeconds: string;
  finalResults: string;
};

export const calculateTimeLeft = (date: Date) => {
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
};

export const calculateTimeLeftString = (date: Date, s: PollTimeStrings) => {
  const { days, hours, minutes, seconds } = calculateTimeLeft(date);
  const daysString = days > 0 ? `${days} ${days === 1 ? s.singularDay : s.pluralDays}` : '';
  const hoursString = hours > 0 ? `${hours} ${hours === 1 ? s.singularHour : s.pluralHours}` : '';
  const minutesString =
    minutes > 0 ? `${minutes} ${minutes === 1 ? s.singularMinute : s.pluralMinutes}` : '';
  const secondsString =
    seconds > 0 ? `${seconds} ${seconds === 1 ? s.singularSecond : s.pluralSeconds}` : '';
  return daysString || hoursString || minutesString || secondsString || s.finalResults;
};
