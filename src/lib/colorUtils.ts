const HEX_REGEX = /^#?([a-f\d]{6}|[a-f\d]{3})$/i;

const clamp = (value: number, min = 0, max = 255) => Math.min(Math.max(value, min), max);

const expandShortHex = (hex: string) => {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return hex;
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  if (!HEX_REGEX.test(hex)) {
    return null;
  }
  const normalized = expandShortHex(hex.startsWith('#') ? hex : `#${hex}`);
  const parsed = parseInt(normalized.slice(1), 16);
  const r = (parsed >> 16) & 255;
  const g = (parsed >> 8) & 255;
  const b = parsed & 255;
  return { r, g, b };
};

export const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (value: number) => {
    const hex = clamp(Math.round(value)).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

/**
 * Lighten (amount > 0) or darken (amount < 0) a hex color.
 * Amount should be between -1 and 1.
 */
export const adjustColor = (hex: string, amount: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;

  if (amount >= 0) {
    return rgbToHex(
      r + (255 - r) * amount,
      g + (255 - g) * amount,
      b + (255 - b) * amount
    );
  }

  const factor = 1 + amount; // amount is negative
  return rgbToHex(r * factor, g * factor, b * factor);
};

/**
 * Returns '#000000' or '#ffffff' depending on which contrasts best with the provided color.
 */
export const getContrastTextColor = (hex: string): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#ffffff';

  const { r, g, b } = rgb;
  // Relative luminance
  const luminance =
    0.2126 * (r / 255) +
    0.7152 * (g / 255) +
    0.0722 * (b / 255);
  return luminance > 0.55 ? '#000000' : '#ffffff';
};

export const withOpacity = (hex: string, alpha: number): string => {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${alpha})`;
};
