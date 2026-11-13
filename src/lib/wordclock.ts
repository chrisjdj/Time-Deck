/**
 * Original 12×10 word-grid layout. Each row is a list of [wordId | null, text].
 * null entries are filler letters.
 */
type Cell = [string | null, string];

const ROWS: Cell[][] = [
  [['IT', 'IT'], [null, 'R'], ['IS', 'IS'], [null, 'U'], ['HALF', 'HALF'], [null, 'DN']],
  [['TEN_M', 'TEN'], [null, 'Q'], ['QUARTER', 'QUARTER'], [null, 'Y']],
  [['TWENTY', 'TWENTY'], ['FIVE_M', 'FIVE'], [null, 'XG']],
  [['MINUTES', 'MINUTES'], [null, 'K'], ['TO', 'TO'], [null, 'JW']],
  [['PAST', 'PAST'], [null, 'B'], ['ONE', 'ONE'], ['TWO', 'TWO'], [null, 'L']],
  [['THREE', 'THREE'], ['FOUR', 'FOUR'], [null, 'VAE']],
  [['FIVE', 'FIVE'], ['SIX', 'SIX'], ['NINE', 'NINE'], [null, 'H']],
  [['SEVEN', 'SEVEN'], ['EIGHT', 'EIGHT'], [null, 'WP']],
  [['TEN', 'TEN'], [null, 'Z'], ['ELEVEN', 'ELEVEN'], [null, 'QC']],
  [['TWELVE', 'TWELVE'], ['OCLOCK', 'OCLOCK']],
];

export interface Letter {
  ch: string;
  word: string | null;
}

export const WORD_GRID: Letter[][] = ROWS.map((row) => row.flatMap(([word, text]) => [...text].map((ch) => ({ ch, word }))));

const HOURS = ['TWELVE', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN'];

/** Words lit for the given time, plus 0–4 extra minute dots. */
export function litWords(hour: number, minute: number): { words: Set<string>; dots: number; sentence: string } {
  const m5 = Math.floor(minute / 5) * 5;
  const dots = minute % 5;
  const w: string[] = ['IT', 'IS'];
  let h = hour % 12;
  const minuteWords: Record<number, string[]> = {
    5: ['FIVE_M', 'MINUTES'],
    10: ['TEN_M', 'MINUTES'],
    15: ['QUARTER'],
    20: ['TWENTY', 'MINUTES'],
    25: ['TWENTY', 'FIVE_M', 'MINUTES'],
    30: ['HALF'],
  };
  if (m5 === 0) w.push(HOURS[h], 'OCLOCK');
  else if (m5 <= 30) w.push(...minuteWords[m5], 'PAST', HOURS[h]);
  else {
    h = (h + 1) % 12;
    w.push(...minuteWords[60 - m5], 'TO', HOURS[h]);
  }
  const sentence = w
    .map((x) => x.replace(/_M$/, '').replace('OCLOCK', "o'clock").toLowerCase())
    .join(' ')
    .replace(/^it is/, 'It is');
  return { words: new Set(w), dots, sentence };
}
