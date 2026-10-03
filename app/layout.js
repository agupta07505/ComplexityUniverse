import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'ComplexityUniverse — Understand what your code costs',
  description:
    'Paste code, get a detailed time & space complexity analysis, and learn algorithm complexity with structured notes. Built with Next.js and MySQL.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#faf9f7',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
