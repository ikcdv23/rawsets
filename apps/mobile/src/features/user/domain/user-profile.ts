export const GOALS = ['mass', 'strength', 'loss', 'maintenance', 'general'] as const;
export type Goal = (typeof GOALS)[number];

export const UNITS = ['kg', 'lb'] as const;
export type Unit = (typeof UNITS)[number];

export const SEXES = ['male', 'female', 'other'] as const;
export type Sex = (typeof SEXES)[number];
