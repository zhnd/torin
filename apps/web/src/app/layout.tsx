import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { ApolloWrapper } from '@/libs/apollo';
import './globals.css';

export const metadata: Metadata = {
  title: 'Torin',
  description: 'AI-powered execution system for software engineering',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ApolloWrapper>{children}</ApolloWrapper>
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
