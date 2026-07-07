export type ParticipationCity = 'Liepāja' | 'Smiltene' | 'Ilūkste';

export const cityDistances: Record<ParticipationCity, string[]> = {
  Liepāja: ['5 km', '14 km', '22 km'],
  Smiltene: ['7 km', '13 km', '21 km'],
  Ilūkste: ['5 km', '12 km', '19 km'],
};

export const participationCities = Object.keys(cityDistances) as ParticipationCity[];
