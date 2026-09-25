export type ParticipationCity = 'Liepāja' | 'Smiltene' | 'Ilūkste';

export const cityDistances: Record<ParticipationCity, string[]> = {
  Liepāja: ['7 km', '17 km', '24 km'],
  Smiltene: ['8 km – “ĶELMĒNI” distance', '18 km – “SMILTENES PIENS” distance', '28 km – “top!” distance', 'Krēslas posms - 8 km'],
  Ilūkste: ['6 km', '14 km', '28 km', 'Krēslas posms - 1,5 km'],
};

export const cityEventDates: Record<ParticipationCity, string> = {
  Liepāja: '26. septembris',
  Smiltene: '26. septembris',
  Ilūkste: '27. septembris',
};

export const participationCities = Object.keys(cityDistances) as ParticipationCity[];

export const editDeadlineIso = '2026-09-21T15:00:00+03:00';
export const editDeadlineDisplay = '21.09.2026. plkst. 15.00';
export const deadlineMessage = `Līdz ${editDeadlineDisplay} iespējams veikt pieteikuma labojumus un pieteikt dalībniekus, lai pasākuma dienā būtu sagatavoti personalizēti dalībnieku numuri. Pieteikšanās būs iespējama arī pēc šī termiņa, taču dalībnieki numurzīmes varēs personalizēt paši pasākuma norises vietā.`;


export const registrationCloseIso = '2026-09-25T12:00:00+03:00';
export const registrationClosedMessage = 'Tiešsaistes reģistrācija #BeActive Pārgājienam 2026 ir noslēgusies. Reģistrēties dalībai joprojām būs iespējams pasākuma dienā uz vietas – reģistrācijas teltī.';
