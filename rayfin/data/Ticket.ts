import {
  entity,
  authenticated,
  uuid,
  text,
  date,
  set,
  one,
  many,
} from '@microsoft/rayfin-core';

import { Client } from './Client.js';
import { TimeEntry } from './TimeEntry.js';

@entity()
@authenticated('*')
export class Ticket {
  @uuid() id!: string;
  @text({ min: 1, max: 200 }) title!: string;
  @text({ optional: true, max: 2000 }) description?: string;
  @set('Low', 'Medium', 'High', 'Critical')
  priority!: 'Low' | 'Medium' | 'High' | 'Critical';
  @set(
    'Password Reset',
    'Network',
    'Email',
    'Hardware',
    'Security',
    'Onboarding',
    'Backup'
  )
  category!:
    | 'Password Reset'
    | 'Network'
    | 'Email'
    | 'Hardware'
    | 'Security'
    | 'Onboarding'
    | 'Backup';
  @set('Open', 'In Progress', 'Closed')
  status!: 'Open' | 'In Progress' | 'Closed';
  @date() createdAt!: Date;
  @date({ optional: true }) closedAt?: Date;
  @one(() => Client) client!: Client;
  @many(() => TimeEntry) timeEntries?: TimeEntry[];
}
