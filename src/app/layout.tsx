import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import Chatbot from '@/components/chatbot';

export const metadata: Metadata = {
  manifest: "/manifest.json",
  title: 'FinTrack',
  description: 'A personal finance optimizer for college students.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Chatbot />
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
