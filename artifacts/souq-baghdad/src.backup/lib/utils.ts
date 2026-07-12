import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const SPECIAL_UUIDS = {
  ALL: '00000000-0000-0000-0000-000000000001',
  GUEST: '00000000-0000-0000-0000-000000000002',
  OWNER: '00000000-0000-0000-0000-000000000003',
};

export function stringToUuid(str: string | null | undefined): string {
  if (!str) return '00000000-0000-0000-0000-000000000000';
  const s = String(str).trim();
  if (UUID_REGEX.test(s)) return s;
  if (s === 'ALL') return SPECIAL_UUIDS.ALL;
  if (s === 'GUEST') return SPECIAL_UUIDS.GUEST;
  if (s === 'OWNER') return SPECIAL_UUIDS.OWNER;

  let hash1 = 0, hash2 = 0, hash3 = 0, hash4 = 0;
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    hash1 = (hash1 * 31 + code) >>> 0;
    hash2 = (hash2 * 37 + code) >>> 0;
    hash3 = (hash3 * 41 + code) >>> 0;
    hash4 = (hash4 * 43 + code) >>> 0;
  }
  const hex1 = hash1.toString(16).padStart(8, '0').slice(0, 8);
  const hex2 = hash2.toString(16).padStart(4, '0').slice(0, 4);
  const hex3 = hash3.toString(16).padStart(4, '0').slice(0, 4);
  const hex4 = hash4.toString(16).padStart(4, '0').slice(0, 4);
  const hex5 = (hash1.toString(16) + hash2.toString(16) + hash3.toString(16)).padStart(12, '0').slice(0, 12);

  return `${hex1}-${hex2}-4${hex3.slice(1)}-a${hex4.slice(1)}-${hex5}`;
}

