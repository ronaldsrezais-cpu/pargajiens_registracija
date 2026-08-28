export type ParticipationCity = 'Liepāja' | 'Smiltene' | 'Ilūkste';

export const cityDistances: Record<ParticipationCity, string[]> = {
  Liepāja: ['7 km', '17 km', '24 km'],
  Smiltene: ['8 km', '18 km', '28 km', 'Krēslas posms - 8 km'],
  Ilūkste: ['6 km', '14 km', '28 km', 'Krēslas posms - 1,5 km'],
};

export const cityEventDates: Record<ParticipationCity, string> = {
  Liepāja: '26. septembris',
  Smiltene: '26. septembris',
  Ilūkste: '27. septembris',
};

export const participationCities = Object.keys(cityDistances) as ParticipationCity[];
