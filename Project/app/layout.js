import './globals.css';
import Header from '../components/Header';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Playwright Test Target App | Enterprise Portal',
  description: 'Production-ready authentication app built for E2E testing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-container">
          <Header />
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
