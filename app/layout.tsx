import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Hike Registration',
  description: 'Register your team for the hike in one of three cities.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
