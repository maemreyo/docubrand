import type { Metadata } from 'next';
import { Inter, Roboto, Open_Sans, Lato, Poppins } from 'next/font/google';
import './globals.css';

// Load fonts for the application
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
});

const openSans = Open_Sans({
  subsets: ['latin'],
  variable: '--font-open-sans',
});

const lato = Lato({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-lato',
});

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'DocuBrand - Rebrand your documents. Keep your content.',
  description: 'A micro-SaaS tool for educators to quickly apply personal branding to teaching documents without changing the original content.',
  keywords: ['PDF', 'branding', 'education', 'documents', 'teachers', 'tutors'],
  authors: [{ name: 'RuthlessCode' }],
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`
      ${inter.variable} 
      ${roboto.variable} 
      ${openSans.variable} 
      ${lato.variable} 
      ${poppins.variable}
    `}>
      <body className={`${inter.className} antialiased bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}