import './globals.css';
import Header from '../components/Header';

export const metadata = {
  title: 'FreightProxy.io | Enterprise Logistics & Proxy Shipping Platform',
  description: 'Production-ready logistics app with role-based access control and live volumetric price engine',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col bg-[#F6F4EE] text-[#16233F] transition-colors duration-300 font-sans">
        <Header />
        <main className="flex-1 w-full flex flex-col bg-[#F6F4EE]">
          {children}
        </main>
      </body>
    </html>
  );
}
