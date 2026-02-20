
export const normalizePhone = (input: unknown): string => {
  // 1. Safe conversion to string (handles null, undefined, numbers)
  const str = String(input ?? "");

  // 2. Remove all non-digit and non-plus characters
  let clean = str.replace(/[^0-9+]/g, '');

  // 3. Handle generic cases
  if (!clean) return '';

  // 4. Qatar Default Logic
  // If input is exactly 8 digits (e.g. 55552222), assume Qatar and append +974
  if (/^[0-9]{8}$/.test(clean)) {
    return `+974${clean}`;
  }

  // If it starts with 00, replace with +
  if (clean.startsWith('00')) {
    clean = '+' + clean.substring(2);
  }

  // If no + prefix, usually ensure it has one if it looks like a local number context
  if (!clean.startsWith('+')) {
      if (clean.startsWith('974')) {
          clean = '+' + clean;
      } else {
          // If ambiguous/short, we just return the clean digits/chars 
          // to allow partial matching in search, or default to Qatar if it matches length rules later.
          // For strict normalization we might prepend +974, but for partial search terms (e.g. "3300") 
          // we don't want to force +9743300 unless it's a full number.
          // However, the previous logic defaulted to +974 for non-plus inputs.
          // We will stick to the safer behavior of only adding +974 if it looks like a full number 
          // OR if we want to force Qatari context. 
          // Reverting to previous logic: Default to +974 if it looks like a number.
          if (clean.length === 8) return `+974${clean}`;
      }
  }

  return clean;
};

export const validatePhone = (input: unknown): { isValid: boolean; error?: string; formatted?: string } => {
  const formatted = normalizePhone(input);

  if (!formatted) return { isValid: false, error: 'Invalid input format' };

  // Check Qatar (+974) specifically
  if (formatted.startsWith('+974')) {
    const localPart = formatted.substring(4);
    if (localPart.length !== 8) {
      return { isValid: false, error: 'Qatar numbers must be exactly 8 digits.', formatted };
    }
  } else {
    // Basic international check (E.164 usually 7-15 digits)
    if (formatted.length < 8 || formatted.length > 16) {
        return { isValid: false, error: 'Invalid international number length.', formatted };
    }
  }

  return { isValid: true, formatted };
};

export const formatPhoneDisplay = (input: unknown): string => {
    const e164 = String(input ?? "");
    if (!e164) return '';
    // Format +974 5555 2222
    if (e164.startsWith('+974') && e164.length === 12) {
        return `${e164.substring(0, 4)} ${e164.substring(4, 8)} ${e164.substring(8, 12)}`;
    }
    return e164;
};
