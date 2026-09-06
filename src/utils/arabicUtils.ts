/**
 * Normalizes Arabic text for flexible search and speech recognition:
 * - Unifies Alef variants (أ, إ, آ, etc.) to bare Alef (ا)
 * - Converts Taa Marbuta (ة) to Haa (ه)
 * - Converts Alef Maqsura (ى) to Yaa (ي)
 * - Strips all Arabic Tashkeel / diacritics (harakat)
 * - Trims and converts to lowercase
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/[ًٌٍَُِّْـ]/g, '')
    .trim();
}
