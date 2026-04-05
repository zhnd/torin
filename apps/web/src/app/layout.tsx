import type { Metadata } from 'next';
import { ApolloWrapper } from '@/lib/apollo-wrapper';
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
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <ApolloWrapper>
          <div className="mx-auto max-w-4xl px-4 py-8">{children}</div>
        </ApolloWrapper>
      </body>
    </html>
  );
}
