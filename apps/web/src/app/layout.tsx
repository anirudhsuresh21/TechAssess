import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/Providers';

export const metadata: Metadata = {
  title: 'TechAssess — Online Assessment Platform for Tech Club Recruitment',
  description:
    'Free, production-grade assessment platform evaluating aptitude, reasoning, and technical fundamentals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#090d16] text-slate-100 antialiased selection:bg-indigo-500 selection:text-white min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
