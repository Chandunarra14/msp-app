import { Client } from './Client.js';
import { Ticket } from './Ticket.js';
import { TimeEntry } from './TimeEntry.js';

export type MspAppSchema = {
  Client: Client;
  Ticket: Ticket;
  TimeEntry: TimeEntry;
};

export const schema = [Client, Ticket, TimeEntry];
