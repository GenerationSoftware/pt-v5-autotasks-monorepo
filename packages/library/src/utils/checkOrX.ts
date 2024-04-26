/**
 * Returns emojis (for pretty console logging).
 *
 * @param {boolean} bool
 *
 * @returns {string}
 */
export const checkOrX = (bool: boolean): string => {
  return bool ? '✔' : '✗';
};
