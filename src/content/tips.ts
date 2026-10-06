/** Daily newborn-care tips by age band (FR-TIP-01). Bundled, bilingual. */
type Tip = { en: string; fr: string };

const TIPS: { maxDays: number; tips: Tip[] }[] = [
  {
    maxDays: 7,
    tips: [
      { en: 'Breastfeed early and often — 8 to 12 times a day, day and night.', fr: 'Allaitez tôt et souvent — 8 à 12 fois par jour, jour et nuit.' },
      { en: 'Keep the cord clean and dry. Do not put anything on it.', fr: 'Gardez le cordon propre et sec. N’y mettez rien.' },
      { en: 'Keep your baby warm: skin-to-skin, a hat and one more layer than you.', fr: 'Gardez bébé au chaud : peau contre peau, un bonnet et une couche de plus que vous.' },
      { en: 'Yellow skin on the first day needs a health worker the same day.', fr: 'Une peau jaune le premier jour demande un agent de santé le jour même.' },
    ],
  },
  {
    maxDays: 28,
    tips: [
      { en: 'Wash your hands before touching the baby, and ask visitors to do the same.', fr: 'Lavez-vous les mains avant de toucher bébé, et demandez aux visiteurs de faire pareil.' },
      { en: 'Never give water, herbal mixtures or syrups to a newborn.', fr: 'Ne donnez jamais d’eau, de mélanges de plantes ni de sirops à un nouveau-né.' },
      { en: 'Lay your baby on the back to sleep, on a firm surface, without pillows.', fr: 'Couchez bébé sur le dos, sur une surface ferme, sans oreiller.' },
      { en: 'Count wet nappies: 6 or more a day means your baby is drinking enough.', fr: 'Comptez les couches mouillées : 6 ou plus par jour, bébé boit assez.' },
    ],
  },
  {
    maxDays: 90,
    tips: [
      { en: 'Vaccines protect your baby. Keep the vaccination card and go on the dates given.', fr: 'Les vaccins protègent bébé. Gardez le carnet et respectez les dates.' },
      { en: 'Talk and sing to your baby — it helps the brain grow.', fr: 'Parlez et chantez à bébé — cela aide son cerveau à se développer.' },
      { en: 'Take your baby to be weighed: growth is a sign of good health.', fr: 'Faites peser bébé : la croissance est un signe de bonne santé.' },
    ],
  },
  {
    maxDays: Infinity,
    tips: [
      { en: 'Exclusive breastfeeding is best until 6 months.', fr: 'L’allaitement exclusif est le meilleur jusqu’à 6 mois.' },
      { en: 'Sleep under a treated mosquito net, every night.', fr: 'Dormez sous une moustiquaire imprégnée, toutes les nuits.' },
      { en: 'Fever in a baby can be serious. Check the temperature and use NeoWell.', fr: 'La fièvre chez un bébé peut être grave. Prenez la température et utilisez NeoWell.' },
    ],
  },
];

export function tipFor(ageDays: number, locale: 'en' | 'fr', date = new Date()): string {
  const band = TIPS.find((b) => ageDays <= b.maxDays)!;
  const dayIndex = Math.floor(date.getTime() / 86_400_000);
  return band.tips[dayIndex % band.tips.length][locale];
}
