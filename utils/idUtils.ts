
const KEYS = {
  CUST: 'qnc_seq_cust',
  TK: 'qnc_seq_tk',
  ACT: 'qnc_seq_act',
  TECH: 'qnc_seq_tech',
};

// Helper to get next sequence number safely from localStorage
const getNextSequence = (key: string, startFrom: number = 1): number => {
  if (typeof window === 'undefined') return startFrom;
  
  const stored = localStorage.getItem(key);
  let current = stored ? parseInt(stored, 10) : startFrom;
  
  if (isNaN(current)) current = startFrom;
  
  const next = current + 1;
  localStorage.setItem(key, next.toString());
  return next;
};

// 1. Customer ID: QNC-CUST-0001
export const generateCustomerId = (): string => {
  const seq = getNextSequence(KEYS.CUST, 10); // Start from 10 to protect mock data range
  return `QNC-CUST-${String(seq).padStart(4, '0')}`;
};

// 2. Ticket ID: QNC-TK-000001
export const generateTicketId = (): string => {
  const seq = getNextSequence(KEYS.TK, 100); 
  return `QNC-TK-${String(seq).padStart(6, '0')}`;
};

// 3. Activity ID: QNC-ACT-000001
export const generateActivityId = (): string => {
  const seq = getNextSequence(KEYS.ACT, 100);
  return `QNC-ACT-${String(seq).padStart(6, '0')}`;
};

// 4. Technician ID: QNC-TECH-0001
export const generateTechId = (): string => {
  const seq = getNextSequence(KEYS.TECH, 10);
  return `QNC-TECH-${String(seq).padStart(4, '0')}`;
};
