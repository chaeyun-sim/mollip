export type InputMode = 'image' | 'manual';

export const store = {
  extractedText: '',
  imageBase64: '',
  imageMediaType: 'image/jpeg' as 'image/jpeg' | 'image/png' | 'image/webp',
  inputMode: 'image' as InputMode,
  manualTitle: '',
  manualArtist: '',
  artworkDescription: '',
  artworkImageUrl: '',
};
