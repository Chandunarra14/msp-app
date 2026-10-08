import {
  entity,
  authenticated,
  uuid,
  text,
  date,
  set,
  many,
} from '@microsoft/rayfin-core';

import { Ticket } from './Ticket.js';

// Shared team data: every signed-in user can read and write all rows.
@entity()
@authenticated('*')
export class Client {
  @uuid() id!: string;
  @text({ min: 1, max: 100 }) name!: string;
  @set('Healthcare', 'Finance', 'Manufacturing', 'Retail', 'Education')
  industry!: 'Healthcare' | 'Finance' | 'Manufacturing' | 'Retail' | 'Education';
  @set('Gold', 'Silver', 'Bronze')
  contractTier!: 'Gold' | 'Silver' | 'Bronze';
  @date() createdAt!: Date;
  @many(() => Ticket) tickets?: Ticket[];
}
