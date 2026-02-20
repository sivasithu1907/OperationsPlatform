
import { Ticket, TicketStatus } from '../types';

export type TicketHealth = 'fresh' | 'warning' | 'stalled';

export const getTicketHealth = (ticket: Ticket): TicketHealth | null => {
  if (ticket.status === TicketStatus.RESOLVED || ticket.status === TicketStatus.CANCELLED) {
    return null;
  }

  const now = Date.now();
  let startTime = 0;
  let thresholds = { warning: 0, stalled: 0 };

  // Logic 1: Assigned (OPEN) or NEW - based on CreatedAt
  if (ticket.status === TicketStatus.OPEN || ticket.status === TicketStatus.NEW) {
     startTime = new Date(ticket.createdAt).getTime();
     thresholds = { warning: 2 * 3600 * 1000, stalled: 6 * 3600 * 1000 }; // 2h, 6h
  } 
  // Logic 2: In Progress - based on StartedAt
  else if (ticket.status === TicketStatus.IN_PROGRESS) {
     // If startedAt is missing, fallback to updatedAt or createdAt to avoid crash
     startTime = ticket.startedAt ? new Date(ticket.startedAt).getTime() : new Date(ticket.updatedAt).getTime(); 
     thresholds = { warning: 3 * 3600 * 1000, stalled: 8 * 3600 * 1000 }; // 3h, 8h
  } else {
      return null;
  }

  const diff = now - startTime;

  if (diff > thresholds.stalled) return 'stalled';
  if (diff > thresholds.warning) return 'warning';
  return 'fresh';
};

export const getHealthColor = (health: TicketHealth | null) => {
    switch(health) {
        case 'fresh': return 'bg-emerald-500';
        case 'warning': return 'bg-amber-500';
        case 'stalled': return 'bg-red-500';
        default: return 'bg-slate-300';
    }
};

export const getHealthBorderColor = (health: TicketHealth | null) => {
    switch(health) {
        case 'fresh': return 'border-emerald-500';
        case 'warning': return 'border-amber-500';
        case 'stalled': return 'border-red-500';
        default: return 'border-slate-300';
    }
};
