import { getRayfinClient } from './rayfinClient';

export const INDUSTRIES = [
  'Healthcare',
  'Finance',
  'Manufacturing',
  'Retail',
  'Education',
] as const;
export const TIERS = ['Gold', 'Silver', 'Bronze'] as const;
export const PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const;
export const CATEGORIES = [
  'Password Reset',
  'Network',
  'Email',
  'Hardware',
  'Security',
  'Onboarding',
  'Backup',
] as const;
export const STATUSES = ['Open', 'In Progress', 'Closed'] as const;

export type Industry = (typeof INDUSTRIES)[number];
export type Tier = (typeof TIERS)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];

export interface ClientRow {
  id: string;
  name: string;
  industry: Industry;
  contractTier: Tier;
  createdAt: Date;
}

export interface TicketRow {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  status: Status;
  createdAt: Date;
  closedAt: Date | null;
  clientId: string;
  clientName: string;
}

export interface TimeRow {
  id: string;
  hours: number;
  isBillable: boolean;
  workDate: Date;
  notes: string;
  loggedBy: string;
  ticketId: string;
  ticketTitle: string;
}

interface Page<T> {
  items: T[];
  hasNextPage: boolean;
  endCursor?: string | null;
}

/** Collection queries return one page at a time, so keep asking until done. */
async function drain<T>(
  fetchPage: (after?: string) => Promise<Page<T>>
): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined;
  for (let guard = 0; guard < 1000; guard++) {
    const page = await fetchPage(after);
    all.push(...page.items);
    if (!page.hasNextPage || !page.endCursor) break;
    after = page.endCursor;
  }
  return all;
}

// ---------------------------------------------------------------- Clients

export async function getClients(): Promise<ClientRow[]> {
  const client = getRayfinClient();
  const rows = await drain((after) => {
    const q = client.data.Client.select([
      'id',
      'name',
      'industry',
      'contractTier',
      'createdAt',
    ])
      .orderBy({ name: 'asc' })
      .first(100);
    return (after ? q.after(after) : q).executePaginated();
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    industry: r.industry,
    contractTier: r.contractTier,
    createdAt: new Date(r.createdAt),
  }));
}

export async function createClient(input: {
  name: string;
  industry: Industry;
  contractTier: Tier;
}): Promise<void> {
  await getRayfinClient().data.Client.create({
    ...input,
    createdAt: new Date(),
  });
}

export async function updateClient(
  id: string,
  input: { name: string; industry: Industry; contractTier: Tier }
): Promise<void> {
  await getRayfinClient().data.Client.update({ id }, input);
}

export async function deleteClient(id: string): Promise<void> {
  await getRayfinClient().data.Client.delete({ id });
}

// ---------------------------------------------------------------- Tickets

// The client serializes null as a GraphQL null (clears the column), but its
// update typing only allows Date | undefined for optional fields.
const CLEARED = null as unknown as undefined;

export async function getTickets(): Promise<TicketRow[]> {
  const client = getRayfinClient();
  const rows = await drain((after) => {
    const q = client.data.Ticket.select([
      'id',
      'title',
      'description',
      'priority',
      'category',
      'status',
      'createdAt',
      'closedAt',
      'client.id',
      'client.name',
    ])
      .orderBy({ createdAt: 'desc' })
      .first(100);
    return (after ? q.after(after) : q).executePaginated();
  });
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    priority: r.priority,
    category: r.category,
    status: r.status,
    createdAt: new Date(r.createdAt),
    closedAt: r.closedAt ? new Date(r.closedAt) : null,
    clientId: r.client?.id ?? '',
    clientName: r.client?.name ?? '(no client)',
  }));
}

export interface TicketInput {
  title: string;
  description: string;
  priority: Priority;
  category: Category;
  status: Status;
  clientId: string;
}

export async function createTicket(input: TicketInput): Promise<void> {
  await getRayfinClient().data.Ticket.create({
    title: input.title,
    description: input.description || undefined,
    priority: input.priority,
    category: input.category,
    status: input.status,
    createdAt: new Date(),
    closedAt: input.status === 'Closed' ? new Date() : undefined,
    client: { id: input.clientId },
  });
}

export async function updateTicket(
  id: string,
  input: TicketInput,
  wasClosed: boolean
): Promise<void> {
  const nowClosed = input.status === 'Closed';
  await getRayfinClient().data.Ticket.update(
    { id },
    {
      title: input.title,
      description: input.description || undefined,
      priority: input.priority,
      category: input.category,
      status: input.status,
      client: { id: input.clientId },
      // Stamp the close time when a ticket moves to Closed, clear it on reopen.
      ...(nowClosed && !wasClosed ? { closedAt: new Date() } : {}),
      ...(!nowClosed && wasClosed ? { closedAt: CLEARED } : {}),
    }
  );
}

export async function setTicketStatus(
  id: string,
  status: Status,
  wasClosed: boolean
): Promise<void> {
  const nowClosed = status === 'Closed';
  await getRayfinClient().data.Ticket.update(
    { id },
    {
      status,
      ...(nowClosed && !wasClosed ? { closedAt: new Date() } : {}),
      ...(!nowClosed && wasClosed ? { closedAt: CLEARED } : {}),
    }
  );
}

export async function deleteTicket(id: string): Promise<void> {
  await getRayfinClient().data.Ticket.delete({ id });
}

// ------------------------------------------------------------ Time entries

export async function getTimeEntries(): Promise<TimeRow[]> {
  const client = getRayfinClient();
  const rows = await drain((after) => {
    const q = client.data.TimeEntry.select([
      'id',
      'hours',
      'isBillable',
      'workDate',
      'notes',
      'loggedBy',
      'ticket.id',
      'ticket.title',
    ])
      .orderBy({ workDate: 'desc' })
      .first(100);
    return (after ? q.after(after) : q).executePaginated();
  });
  return rows.map((r) => ({
    id: r.id,
    hours: Number(r.hours),
    isBillable: r.isBillable,
    workDate: new Date(r.workDate),
    notes: r.notes ?? '',
    loggedBy: r.loggedBy,
    ticketId: r.ticket?.id ?? '',
    ticketTitle: r.ticket?.title ?? '(no ticket)',
  }));
}

export interface TimeInput {
  ticketId: string;
  hours: number;
  isBillable: boolean;
  workDate: Date;
  notes: string;
}

export async function createTimeEntry(input: TimeInput): Promise<void> {
  const client = getRayfinClient();
  const session = client.auth.getSession();
  if (!session.isAuthenticated || !session.user) {
    throw new Error('You need to be signed in to log time.');
  }
  await client.data.TimeEntry.create({
    hours: input.hours,
    isBillable: input.isBillable,
    workDate: input.workDate,
    notes: input.notes || undefined,
    loggedBy: session.user.email ?? session.user.id,
    ticket: { id: input.ticketId },
  });
}

export async function updateTimeEntry(
  id: string,
  input: TimeInput
): Promise<void> {
  await getRayfinClient().data.TimeEntry.update(
    { id },
    {
      hours: input.hours,
      isBillable: input.isBillable,
      workDate: input.workDate,
      notes: input.notes || undefined,
      ticket: { id: input.ticketId },
    }
  );
}

export async function deleteTimeEntry(id: string): Promise<void> {
  await getRayfinClient().data.TimeEntry.delete({ id });
}

// ------------------------------------------------------------- Sample data

/** Small deterministic generator so everyone gets the same demo data. */
function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export async function loadSampleData(): Promise<void> {
  const client = getRayfinClient();
  const session = client.auth.getSession();
  const who = session.user?.email ?? session.user?.id ?? 'sample@demo';
  const rand = makeRng(42);
  const pick = <T,>(list: readonly T[]): T =>
    list[Math.floor(rand() * list.length)];
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000);

  const clientNames = [
    'Northwind Clinic',
    'Contoso Bank',
    'Fabrikam Steel',
    'Tailspin Retail',
    'Lakeside Academy',
    'Harbor Dental Group',
  ];
  const clientIds: string[] = [];
  for (const name of clientNames) {
    const created = await client.data.Client.create({
      name,
      industry: pick(INDUSTRIES),
      contractTier: pick(TIERS),
      createdAt: daysAgo(200),
    });
    clientIds.push(created.id);
  }

  const titles = [
    'User cannot log in',
    'Outlook keeps asking for password',
    'Wi-Fi drops in conference room',
    'New hire laptop setup',
    'Printer offline on 2nd floor',
    'Suspicious email reported',
    'Nightly backup failed',
    'VPN will not connect',
    'Shared mailbox access request',
    'Slow computer after update',
    'Replace failing hard drive',
    'MFA reset for executive',
  ];

  const ticketIds: string[] = [];
  for (let i = 0; i < 24; i++) {
    const age = Math.floor(rand() * 60) + 1;
    const status = pick(['Open', 'In Progress', 'Closed', 'Closed'] as const);
    const created = await client.data.Ticket.create({
      title: pick(titles),
      description: 'Sample ticket created by the demo data loader.',
      priority: pick(PRIORITIES),
      category: pick(CATEGORIES),
      status,
      createdAt: daysAgo(age),
      closedAt: status === 'Closed' ? daysAgo(Math.max(age - 2, 0)) : undefined,
      client: { id: pick(clientIds) },
    });
    ticketIds.push(created.id);
  }

  for (let i = 0; i < 60; i++) {
    await client.data.TimeEntry.create({
      hours: pick([0.25, 0.5, 0.75, 1, 1.5, 2, 3]),
      isBillable: rand() < 0.7,
      workDate: daysAgo(Math.floor(rand() * 45)),
      notes: 'Sample time entry',
      loggedBy: who,
      ticket: { id: pick(ticketIds) },
    });
  }
}
