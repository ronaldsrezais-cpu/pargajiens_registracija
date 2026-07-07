import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pārgājiena reģistrācija',
  description: 'Komandas pieteikšanās pārgājienam Liepājā, Smiltenē vai Ilūkstē.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lv">
      <body>{children}</body>
    </html>
  );
}
