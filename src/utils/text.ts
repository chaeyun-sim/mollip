export function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function cleanTextForTTS(text: string): string {
  return text
    .replace(
      /(\d+(?:\.\d+)?)\s*[xX×]\s*(\d+(?:\.\d+)?)\s*(센티미터|cm|CM|미터|m|M)?/g,
      (_, w, h, unit) => {
        const u = unit
          ? ` ${unit === 'cm' || unit === 'CM' ? '센티미터' : unit === 'm' || unit === 'M' ? '미터' : unit}`
          : '';
        return `가로 ${w}${u}, 세로 ${h}${u}`;
      },
    )
    .replace(/(\d+)\.(\d+)/g, '$1점$2')
    .replace(/\n+/g, ' ')
    .replace(/\.{2,}/g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
