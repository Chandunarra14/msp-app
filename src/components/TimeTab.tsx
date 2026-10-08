import { useState } from 'react';

import {
  EmptyRow,
  Field,
  Modal,
  dateStr,
  fromInputDate,
  ghostBtn,
  inputClass,
  primaryBtn,
  td,
  th,
  toInputDate,
} from '@/components/ui';
import {
  createTimeEntry,
  deleteTimeEntry,
  updateTimeEntry,
  type TicketRow,
  type TimeInput,
  type TimeRow,
} from '@/services/msp';

interface Props {
  entries: TimeRow[];
  tickets: TicketRow[];
  run: (action: () => Promise<void>) => Promise<void>;
}

export function TimeTab({ entries, tickets, run }: Props) {
  const [editing, setEditing] = useState<TimeRow | 'new' | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          className={primaryBtn}
          disabled={tickets.length === 0}
          title={tickets.length === 0 ? 'Create a ticket first' : undefined}
          onClick={() => setEditing('new')}
        >
          Log time
        </button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Ticket</th>
              <th className={th}>Hours</th>
              <th className={th}>Billable</th>
              <th className={th}>Logged by</th>
              <th className={th}></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {entries.length === 0 && (
              <EmptyRow cols={6} text="No time logged yet." />
            )}
            {entries.map((e) => (
              <tr key={e.id}>
                <td className={td}>{dateStr(e.workDate)}</td>
                <td className={td}>
                  <div className="text-gray-900">{e.ticketTitle}</div>
                  {e.notes && (
                    <div className="text-xs text-gray-400">{e.notes}</div>
                  )}
                </td>
                <td className={td}>{e.hours}</td>
                <td className={td}>{e.isBillable ? 'Yes' : 'No'}</td>
                <td className={td}>{e.loggedBy}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  <button
                    className="mr-3 text-blue-600 hover:underline"
                    onClick={() => setEditing(e)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => {
                      if (window.confirm('Delete this time entry?')) {
                        void run(() => deleteTimeEntry(e.id));
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
        <TimeForm
          initial={editing === 'new' ? null : editing}
          tickets={tickets}
          onClose={() => setEditing(null)}
          onSave={async (values) => {
            const current = editing;
            setEditing(null);
            await run(() =>
              current === 'new'
                ? createTimeEntry(values)
                : updateTimeEntry(current.id, values)
            );
          }}
        />
      )}
    </div>
  );
}

function TimeForm({
  initial,
  tickets,
  onClose,
  onSave,
}: {
  initial: TimeRow | null;
  tickets: TicketRow[];
  onClose: () => void;
  onSave: (v: TimeInput) => Promise<void>;
}) {
  const [ticketId, setTicketId] = useState(
    initial?.ticketId || tickets[0]?.id || ''
  );
  const [hours, setHours] = useState(String(initial?.hours ?? 1));
  const [billable, setBillable] = useState(initial?.isBillable ?? true);
  const [workDate, setWorkDate] = useState(
    toInputDate(initial?.workDate ?? new Date())
  );
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const hoursNum = Number(hours);
  const valid = ticketId && hoursNum > 0 && hoursNum <= 24 && workDate;

  return (
    <Modal title={initial ? 'Edit time entry' : 'Log time'} onClose={onClose}>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          void onSave({
            ticketId,
            hours: hoursNum,
            isBillable: billable,
            workDate: fromInputDate(workDate),
            notes: notes.trim(),
          });
        }}
      >
        <Field label="Ticket">
          <select
            className={inputClass}
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          >
            {tickets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.clientName})
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Hours">
            <input
              className={inputClass}
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
          <Field label="Date">
            <input
              className={inputClass}
              type="date"
              value={workDate}
              onChange={(e) => setWorkDate(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={billable}
            onChange={(e) => setBillable(e.target.checked)}
          />
          Billable
        </label>
        <Field label="Notes">
          <input
            className={inputClass}
            maxLength={500}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className={ghostBtn} onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className={primaryBtn} disabled={!valid}>
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
