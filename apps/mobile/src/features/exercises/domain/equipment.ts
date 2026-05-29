export const EQUIPMENT = [
  'barra',
  'mancuerna',
  'peso-corporal',
  'maquina',
  'polea',
  'otro',
] as const;

export type Equipment = (typeof EQUIPMENT)[number];
