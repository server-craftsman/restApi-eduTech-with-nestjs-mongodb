const VIETNAMESE_CHAR_GROUPS: Readonly<Record<string, string>> = {
  a: 'aàáảãạăằắẳẵặâầấẩẫậ',
  e: 'eèéẻẽẹêềếểễệ',
  i: 'iìíỉĩị',
  o: 'oòóỏõọôồốổỗộơờớởỡợ',
  u: 'uùúủũụưừứửữự',
  y: 'yỳýỷỹỵ',
  d: 'dđ',
};

const SPECIAL_REGEX_CHARS = /[.*+?^${}()|[\]\\]/g;

/**
 * Remove Vietnamese diacritics and normalize to lower-case plain Latin.
 */
export const normalizeVietnameseText = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
};

const escapeRegexChar = (char: string): string =>
  char.replace(SPECIAL_REGEX_CHARS, '\\$&');

/**
 * Build a Vietnamese accent-insensitive regex pattern.
 *
 * Example input: "toan hoc"
 * Pattern will match: "Toán học", "toan hoc", "TOÁN HỌC", ...
 */
export const buildVietnameseFuzzyPattern = (rawKeyword: string): string => {
  const normalized = normalizeVietnameseText(rawKeyword);

  let pattern = '';
  for (const char of normalized) {
    if (char === ' ') {
      pattern += '\\s+';
      continue;
    }

    const group = VIETNAMESE_CHAR_GROUPS[char];
    if (group) {
      pattern += `[${group}]`;
    } else {
      pattern += escapeRegexChar(char);
    }
  }

  return pattern;
};

/**
 * Build Mongo regex query for Vietnamese accent-insensitive search.
 */
export const buildVietnameseRegexQuery = (
  keyword: string,
): { $regex: string; $options: 'i' } => {
  const pattern = buildVietnameseFuzzyPattern(keyword);
  return {
    $regex: pattern,
    $options: 'i',
  };
};
