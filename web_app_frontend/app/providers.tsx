'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { ToastProvider } from '@/components/ui/toast';
import { ConfirmProvider } from '@/components/ui/confirm';
import { GlobalSpinner } from '@/components/feedback/GlobalSpinner';
import { ChatPresenceProvider } from '@/features/chat/context/ChatPresenceContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 1000 * 60, retry: 1, refetchOnWindowFocus: false },
          mutations: { retry: 0 },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <ConfirmProvider>
          <ChatPresenceProvider>
            <GlobalSpinner />
            {children}
          </ChatPresenceProvider>
        </ConfirmProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
