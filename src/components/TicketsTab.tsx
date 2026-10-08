import { useMemo, useState } from 'react';

import {
  Badge,
  EmptyRow,
  Field,
  Modal,
  dateStr,
  ghostBtn,
  inputClass,
  primaryBtn,
  td,
  th,
} from '@/components/ui';
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  createTicket,
  deleteTicket,
  setTicketStatus,
  updateTicket,
  type Category,
  type ClientRow,
  type Priority,
  type Status,
  type TicketInput,
  type TicketRow,
} from '@/services/msp';

interface Props {
  tickets: TicketRow[];
  clients: ClientRow[];
  run: (action: () => Promise<void>) => Promise<void>;
}

export function TicketsTab({ tickets, clients, run }: Props) {
  const [editing, setEditing] = useState<TicketRow | 'new' | null>(null);
  const [statusFilter, setStatusFilter] = useState<Status | 'All'>('All');
  const [search, setSearch] = useState('');

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter(
      (t) =>
        (statusFilter === 'All' || t.status === statusFilter) &&
        (!q ||
          t.title.toLowerCase().includes(q) ||
          t.clientName.toLowerCase().includes(q))
    );
  }, [tickets, statusFilter, search]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className={`${inputClass} max-w-xs`}
          placeholder="Search tickets or clients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={`${inputClass} max-w-[10rem]`}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | 'All')}
        >
          <option>All</option>
          {STATUSES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          className={primaryBtn}
          disabled={clients.length === 0}
          title={clients.length === 0 ? 'Add a client first' : undefined}
          onClick={() => setEditing('new')}
        >
          New ticket
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={th}>Ticket</th>
              <th className={th}>Client</th>
              <th className={th}>Priority</th>
              <th className={th}>Status</th>
              <th className={th}>Created</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shown.length === 0 && (
              <EmptyRow cols={6} text="No tickets match." />
            )}
            {shown.map((t) => (
              <tr key={t.id}>
                <td className={td}>
                  <div className="font-medium text-gray-900">{t.title}</div>
                  <div className="text-xs text-gray-400">{t.category}</div>
                </td>
                <td className={td}>{t.clientName}</td>
                <td className={td}>
                  <Badge value={t.priority} />
                </td>
                <td className={td}>
                  <select
                    className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs"
                    value={t.status}
                    onChange={(e) =>
                      void run(() =>
                        setTicketStatus(
                          t.id,
                          e.target.value as Status,
                          t.status === 'Closed'
                        )
                      )
                    }
                  >
                    {STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className={td}>{dateStr(t.createdAt)}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  <button
                    className="mr-3 text-blue-600 hover:underline"
                    onClick={() => setEditing(t)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Delete this ticket? Remove its time entries first if it has any.'
                        )
                      ) {
                        void run(() => deleteTicket(t.id));
                      }
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <TicketForm
          initial={editing === 'new' ? null : editing}
          clients={clients}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            const current = editing;
            setEditing(null);
            await run(() =>
              current === 'new'
                ? createTicket(values)
                : updateTicket(current.id, values, current.status === 'Closed')
            );
          }}
        />
      )}
    </div>
  );
}

function TicketForm({
  initial,
  clients,
  onClose,
  onSave,
}: {
  initial: TicketRow | null;
  clients: ClientRow[];
  onClose: () => void;
  onSave: (v: TicketInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [clientId, setClientId] = useState(
    initial?.clientId || clients[0]?.id || ''
  );
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? 'Medium'
  );
  const [category, setCategory] = useState<Category>(
    initial?.category ?? CATEGORIES[0]
  );
  const [status, setStatus] = useState<Status>(initial?.status ?? 'Open');

  return (
    <Modal title={initial ? 'Edit ticket' : 'New ticket'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim() || !clientId) return;
          void onSave({
            title: title.trim(),
            description: description.trim(),
            clientId,
            priority,
            category,
            status,
          });
        }}
      >
        <Field label="Title">
          <input
            className={inputClass}
            value={title}
            maxLength={200}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Description">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={2000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label="Client">
          <select
            className={inputClass}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority">
            <select
              className={inputClass}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className={inputClass}
              value={status}
              onChange={(e) => setStatus(e.target.value as Status)}
            >
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Category">
          <select
            className={inputClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className={primaryBtn}
            disabled={!title.trim() || !clientId}
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
