import {
  entity,
  authenticated,
  uuid,
  text,
  decimal,
  boolean,
  date,
  one,
} from '@microsoft/rayfin-core';

import { Ticket } from './Ticket.js';

@entity()
@authenticated('*')
export class TimeEntry {
  @uuid() id!: string;
  @decimal() hours!: number;
  @boolean() isBillable!: boolean;
  @date() workDate!: Date;
  @text({ optional: true, max: 500 }) notes?: string;
  @text({ max: 200 }) loggedBy!: string;
  @one(() => Ticket) ticket!: Ticket;
}
