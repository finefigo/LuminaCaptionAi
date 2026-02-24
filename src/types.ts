export type Mood = 'Normal' | 'Happy' | 'Sad' | 'Funny' | 'Romantic' | 'Dramatic' | 'Inspirational' | 'Poetic';

export interface CaptionResult {
  base: string;
  enhanced: string;
  mood: Mood;
}

export const MOODS: Mood[] = [
  'Normal',
  'Happy',
  'Sad',
  'Funny',
  'Romantic',
  'Dramatic',
  'Inspirational',
  'Poetic'
];
