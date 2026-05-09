import { clsx } from 'clsx';

export const cn = (...inputs: Array<string | undefined | false | null>) => clsx(inputs);
