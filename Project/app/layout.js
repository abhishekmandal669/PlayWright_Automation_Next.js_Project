import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'FreightProxy.io | Enterprise Logistics & Proxy Shipping Platform',
  description: 'Production-ready logistics app with role-based access control and volumetric price engine',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-300 font-sans">
        <Header />
        <main className="flex-1 flex flex-col justify-center items-center px-4 py-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
