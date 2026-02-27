import { nanoid } from 'nanoid';

/**
 * nanoid를 사용하여 고유한 공유 링크를 생성합니다.
 * 10자 길이의 영숫자 문자열을 반환합니다.
 *
 * 예시:
 * - 'a1B2c3D4e5'
 * - 'xY9zW8vU7t'
 *
 * @returns {string} 10자 길이의 고유 공유 링크
 */
export const generateShareLink = (): string => {
  return nanoid(10);
};
