import { useCallback, useEffect, useMemo, useState } from 'react';

import { ClientsTab } from '@/components/ClientsTab';
import { TicketsTab } from '@/components/TicketsTab';
import { TimeTab } from '@/components/TimeTab';
import { Stat, ghostBtn, primaryBtn } from '@/components/ui';
import { useAuth } from '@/hooks/AuthContext';
import {
  getClients,
  getTickets,
  getTimeEntries,
  loadSampleData,
  type ClientRow,
  type TicketRow,
  type TimeRow,
} from '@/services/msp';

type Tab = 'tickets' | 'clients' | 'time';

const TABS: { id: Tab; label: string }[] = [
  { id: 'tickets', label: 'Tickets' },
  { id: 'clients', label: 'Clients' },
  { id: 'time', label: 'Time' },
];

export function HomePage() {
  const { signOut, user } = useAuth();
  const [tab, setTab] = useState<Tab>('tickets');
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [entries, setEntries] = useState<TimeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [c, t, e] = await Promise.all([
      getClients(),
      getTickets(),
      getTimeEntries(),
    ]);
    setClients(c);
    setTickets(t);
    setEntries(e);
  }, []);

  useEffect(() => {
    refresh()
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load data.')
      )
      .finally(() => setLoading(false));
  }, [refresh]);

  /** Runs a write, then reloads. Any failure is shown in the banner. */
  const run = useCallback(
    async (action: () => Promise<void>) => {
      setError(null);
      setBusy(true);
      try {
        await action();
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong.');
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const stats = useMemo(() => {
    const open = tickets.filter((t) => t.status !== 'Closed').length;
    const total = entries.reduce((sum, e) => sum + e.hours, 0);
    const billable = entries
      .filter((e) => e.isBillable)
      .reduce((sum, e) => sum + e.hours, 0);
    return {
      open,
      total,
      billablePct: total > 0 ? Math.round((billable / total) * 100) : 0,
    };
  }, [tickets, entries]);

  const ticketCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of tickets) counts[t.clientId] = (counts[t.clientId] ?? 0) + 1;
    return counts;
  }, [tickets]);

  const isEmpty =
    !loading && clients.length === 0 && tickets.length === 0 && !error;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-8 py-5">
        <h1 className="text-xl font-bold text-gray-900">MSP Service Desk</h1>
        <div className="flex items-center gap-4">
          {user?.email && (
            <span className="text-sm text-gray-600" title={user.email}>
              {user.email}
            </span>
          )}
          <button
            onClick={() => void signOut()}
            className="text-sm text-gray-400 hover:text-gray-600"
            aria-label="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              className="ml-4 text-red-500 hover:text-red-700"
              onClick={() => setError(null)}
              aria-label="Dismiss error"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Open tickets" value={String(stats.open)} />
          <Stat label="Clients" value={String(clients.length)} />
          <Stat label="Hours logged" value={stats.total.toFixed(1)} />
          <Stat label="Billable" value={`${stats.billablePct}%`} />
        </div>

        {isEmpty && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-5 py-4">
            <p className="text-sm text-blue-900">
              Nothing here yet. Load some sample clients, tickets and time
              entries, or start adding your own.
            </p>
            <button
              className={primaryBtn}
              disabled={busy}
              onClick={() => void run(loadSampleData)}
            >
              {busy ? 'Loading...' : 'Load sample data'}
            </button>
          </div>
        )}

        <div className="mb-5 flex items-center gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                tab === t.id
                  ? 'rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white'
                  : ghostBtn
              }
            >
              {t.label}
            </button>
          ))}
          {busy && <span className="ml-2 text-xs text-gray-400">Saving...</span>}
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-400">Loading...</p>
        ) : (
          <>
            {tab === 'tickets' && (
              <TicketsTab tickets={tickets} clients={clients} run={run} />
            )}
            {tab === 'clients' && (
              <ClientsTab
                clients={clients}
                ticketCounts={ticketCounts}
                run={run}
              />
            )}
            {tab === 'time' && (
              <TimeTab entries={entries} tickets={tickets} run={run} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
