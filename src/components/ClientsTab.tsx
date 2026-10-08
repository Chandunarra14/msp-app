import { useState } from 'react';

import {
  Badge,
  EmptyRow,
  Field,
  Modal,
  ghostBtn,
  inputClass,
  primaryBtn,
  td,
  th,
} from '@/components/ui';
import {
  INDUSTRIES,
  TIERS,
  createClient,
  deleteClient,
  updateClient,
  type ClientRow,
  type Industry,
  type Tier,
} from '@/services/msp';

interface Props {
  clients: ClientRow[];
  ticketCounts: Record<string, number>;
  run: (action: () => Promise<void>) => Promise<void>;
}

export function ClientsTab({ clients, ticketCounts, run }: Props) {
  const [editing, setEditing] = useState<ClientRow | 'new' | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button className={primaryBtn} onClick={() => setEditing('new')}>
          Add client
        </button>
      </div>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={th}>Name</th>
              <th className={th}>Industry</th>
              <th className={th}>Tier</th>
              <th className={th}>Tickets</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clients.length === 0 && (
              <EmptyRow cols={5} text="No clients yet." />
            )}
            {clients.map((c) => (
              <tr key={c.id}>
                <td className={`${td} font-medium text-gray-900`}>{c.name}</td>
                <td className={td}>{c.industry}</td>
                <td className={td}>
                  <Badge value={c.contractTier} />
                </td>
                <td className={td}>{ticketCounts[c.id] ?? 0}</td>
                <td className={`${td} text-right`}>
                  <button
                    className="mr-3 text-blue-600 hover:underline"
                    onClick={() => setEditing(c)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete ${c.name}? Delete its tickets first if it has any.`
                        )
                      ) {
                        void run(() => deleteClient(c.id));
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
        <ClientForm
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            setEditing(null);
            await run(() =>
              editing === 'new'
                ? createClient(values)
                : updateClient(editing.id, values)
            );
          }}
        />
      )}
    </div>
  );
}

function ClientForm({
  initial,
  onClose,
  onSave,
}: {
  initial: ClientRow | null;
  onClose: () => void;
  onSave: (v: {
    name: string;
    industry: Industry;
    contractTier: Tier;
  }) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [industry, setIndustry] = useState<Industry>(
    initial?.industry ?? INDUSTRIES[0]
  );
  const [tier, setTier] = useState<Tier>(initial?.contractTier ?? 'Silver');

  return (
    <Modal title={initial ? 'Edit client' : 'Add client'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          void onSave({
            name: name.trim(),
            industry,
            contractTier: tier,
          });
        }}
      >
        <Field label="Name">
          <input
            className={inputClass}
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Industry">
          <select
            className={inputClass}
            value={industry}
            onChange={(e) => setIndustry(e.target.value as Industry)}
          >
            {INDUSTRIES.map((i) => (
              <option key={i}>{i}</option>
            ))}
          </select>
        </Field>
        <Field label="Contract tier">
          <select
            className={inputClass}
            value={tier}
            onChange={(e) => setTier(e.target.value as Tier)}
          >
            {TIERS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={!name.trim()}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
