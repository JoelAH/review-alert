import dayjs from 'dayjs';

export function formatDate(value: string | Date | undefined) {
    return dayjs(new Date(value || new Date())).format('MMM D, YYYY');
}