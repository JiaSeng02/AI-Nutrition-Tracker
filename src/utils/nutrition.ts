export function formatKcal(calories: number): string {
  return `${Math.round(calories).toLocaleString()} kcal`;
}

export function formatGram(amount: number): string {
  return `${Math.round(amount)} g`;
}

export function calculateProgress(current: number, target: number): number {
  if (target <= 0) return 0;
  const ratio = current / target;
  return Math.min(Math.max(ratio, 0), 1);
}

export function calculateMacroPercentages(protein: number, carbs: number, fat: number) {
  const proteinKcal = protein * 4;
  const carbsKcal = carbs * 4;
  const fatKcal = fat * 9;
  const total = proteinKcal + carbsKcal + fatKcal;

  if (total <= 0) {
    return { proteinPct: 0, carbsPct: 0, fatPct: 0 };
  }

  return {
    proteinPct: Math.round((proteinKcal / total) * 100),
    carbsPct: Math.round((carbsKcal / total) * 100),
    fatPct: Math.round((fatKcal / total) * 100),
  };
}
