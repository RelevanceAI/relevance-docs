'use client';
import SearchDialog from '@/components/search';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { type ReactNode } from 'react';

export function Provider({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      search={{ SearchDialog }}
      // Mintlify's navbar trigger reads "Search...". Fumadocs keys a string by
      // its English text plus the call site's note in parentheses, so this
      // reaches the trigger alone and leaves the dialog's own input untouched.
      i18n={{ translations: { 'Search(search trigger)': 'Search...' } }}
    >
      {children}
    </RootProvider>
  );
}
