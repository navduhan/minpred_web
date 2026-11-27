import './globals.css';
import type { Metadata } from 'next';
import Script from 'next/script';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'MINpred · Soil Nitrogen Mineralization Enzyme & EC Prediction',
  description:
    'Alignment-free four-phase ESM-2 (650M) identification and four-digit EC classification of soil nitrogen-mineralization peptidases and amidohydrolases.',
  keywords: [
    'MINpred',
    'Soil Nitrogen Mineralization',
    'Peptidases',
    'Amidohydrolases',
    'Enzyme Commission',
    'ESM-2',
    'Protein Language Model',
    'KAABiL',
  ],
  authors: [
    { name: 'Naveen Duhan', url: 'https://github.com/navduhan' },
    { name: 'Jeanette M. Norton' },
    { name: 'Rakesh Kaundal', url: 'https://kaabil.net' },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-white antialiased">
        <Navbar />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
        <Footer />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-FPHG3TYT4N"
          strategy="afterInteractive"
        />
        <Script id="minpred-google-tag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-FPHG3TYT4N');`}
        </Script>
      </body>
    </html>
  );
}
