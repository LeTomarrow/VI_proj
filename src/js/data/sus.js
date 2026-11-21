// System Usability Scale score from the 10 raw answers (1-5), standard rule: odd items
// (answer − 1), even items (5 − answer), sum × 2.5. Null when the answers are incomplete.
export const SUS_AVERAGE = 68; // Sauro & Lewis: the average SUS score

export function susScore(answers) {
  if (answers?.length !== 10 || answers.some((a) => !(a >= 1 && a <= 5))) return null;
  return 2.5 * answers.reduce((sum, a, i) => sum + (i % 2 === 0 ? a - 1 : 5 - a), 0);
}
