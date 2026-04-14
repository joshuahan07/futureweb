import type { Metadata } from 'next';
import './globals.css';
import { UserProvider } from '@/components/UserContext';
import { ThemeProvider } from '@/components/ThemeContext';
import DbHealthCheck from '@/components/DbHealthCheck';

export const metadata: Metadata = {
  title: 'LoveNest — J & S',
  description: 'Our private collaborative space',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col font-body">
        <ThemeProvider>
          <UserProvider>
            {children}
            <DbHealthCheck />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
