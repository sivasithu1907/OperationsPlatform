
import { Priority, TicketStatus, MessageSender, Technician, Ticket, Customer, Role, TicketType, Team, Site, Activity, ActivityStatus } from './types';
import { LayoutDashboard, Ticket as TicketIcon, Smartphone, Cpu, Users, BookOpen, Map, Activity as ActivityIcon, Calendar, Contact, FileBarChart, UserCog, Database, MessageCircle } from 'lucide-react';

export const APP_NAME = "Qonnect";

// --- STATUS LABELS (DB-safe values, UI-friendly text) ---
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In-Progress',
  DONE: 'Done',
  CANCELLED: 'Cancelled',
};

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  OPEN: 'Open',
  ASSIGNED: 'Assigned',
  ON_MY_WAY: 'On My Way',
  ARRIVED: 'Arrived',
  IN_PROGRESS: 'In-Progress',
  CARRY_FORWARD: 'Carry Forward',
  RESOLVED: 'Resolved',
  CANCELLED: 'Cancelled',
};

export const getActivityStatusLabel = (s: ActivityStatus) =>
  ACTIVITY_STATUS_LABELS[s] ?? s;

export const getTicketStatusLabel = (s: TicketStatus) =>
  TICKET_STATUS_LABELS[s] ?? s;

// --- GLOBAL DESIGN TOKENS ---
export const INPUT_STYLES = "w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-[14px] py-[12px] text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#FFCC00] focus:ring-[4px] focus:ring-[#FFCC00]/25 disabled:bg-[#F1F5F9] disabled:text-[#94A3B8] disabled:border-transparent disabled:cursor-not-allowed resize-none";
export const SEARCH_INPUT_STYLES = "w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-[14px] py-[12px] text-sm font-medium text-[#0F172A] placeholder-[#94A3B8] outline-none transition-all focus:bg-[#FFFFFF] focus:border-[#FFCC00] focus:ring-[4px] focus:ring-[#FFCC00]/25";

export const NAVIGATION_ITEMS = [
  // --- After-Sales ---
  { 
    id: 'dashboard', 
    label: 'Service Dashboard', 
    icon: <LayoutDashboard size={20} />, 
    roles: [Role.ADMIN],
    category: 'After-Sales'
  },
  { 
    id: 'tickets', 
    label: 'Active Tickets', 
    icon: <TicketIcon size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'After-Sales'
  },

  // --- Operations ---
  { 
    id: 'operations', 
    label: 'Operations Monitor', 
    icon: <ActivityIcon size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'Operations'
  },
  { 
    id: 'planning', 
    label: 'Activity Planner', 
    icon: <Calendar size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'Operations'
  },

  // --- General ---
  { 
    id: 'customers', 
    label: 'Clients', 
    icon: <Contact size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'General'
  },
  { 
    id: 'reports', 
    label: 'Reports & Analytics', 
    icon: <FileBarChart size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'General'
  },

  // --- Admin ---
  { 
    id: 'users', 
    label: 'User Management', 
    icon: <UserCog size={20} />, 
    roles: [Role.ADMIN],
    category: 'Admin'
  },
  { 
    id: 'team', 
    label: 'Team Management', 
    icon: <Users size={20} />, 
    roles: [Role.ADMIN],
    category: 'Admin'
  },
  { 
    id: 'system_tools', 
    label: 'Data Tools', 
    icon: <Database size={20} />, 
    roles: [Role.ADMIN],
    category: 'Admin'
  },
  { 
    id: 'whatsapp_monitor', 
    label: 'WhatsApp Monitor', 
    icon: <MessageCircle size={20} />, 
    roles: [Role.ADMIN],
    category: 'Admin'
  },

  // --- Portals & Tools ---
  { 
    id: 'lead_portal', 
    label: 'Lead Portal (Mobile)', 
    icon: <Smartphone size={20} />, 
    roles: [Role.ADMIN, Role.TEAM_LEAD],
    category: 'Portals & Tools'
  },
  { 
    id: 'tech_portal', 
    label: 'Tech Portal (Mobile)', 
    icon: <Smartphone size={20} />, 
    roles: [Role.ADMIN, Role.FIELD_ENGINEER],
    category: 'Portals & Tools'
  },
  { 
    id: 'simulator', 
    label: 'Flow Simulator', 
    icon: <Cpu size={20} />, 
    roles: [Role.ADMIN],
    category: 'Portals & Tools'
  },
  { 
    id: 'guide', 
    label: 'Integration Guide', 
    icon: <BookOpen size={20} />, 
    roles: [Role.ADMIN],
    category: 'Portals & Tools'
  },
];

export const MOCK_TECHNICIANS: Technician[] = [
  // --- Admin ---
  {
    id: 'QNC-TECH-0001',
    name: 'System Admin',
    status: 'AVAILABLE',
    role: 'Administrator',
    systemRole: Role.ADMIN,
    isActive: true,
    level: 'TEAM_LEAD', // Maps Admin to Team Lead level UI
    email: 'admin@qonnect.com',
    password: 'admin123',
    phone: '+974 0000 0000',
    avatar: 'https://ui-avatars.com/api/?name=System+Admin&background=000&color=fff'
  },
  {
    id: 'QNC-TECH-0002', 
    name: 'Karim Benz',
    status: 'BUSY',
    role: 'Senior Engineer',
    systemRole: Role.TEAM_LEAD,
    isActive: true,
    level: 'TEAM_LEAD',
    email: 'karim@qonnect.com',
    phone: '+974 5500 1111',
    avatar: 'https://ui-avatars.com/api/?name=Karim+Benz&background=random'
  },
  {
    id: 'QNC-TECH-0003',
    name: 'Sarah Chen',
    status: 'AVAILABLE',
    role: 'Field Engineer',
    systemRole: Role.FIELD_ENGINEER,
    isActive: true,
    level: 'FIELD_ENGINEER',
    email: 'sarah@qonnect.com',
    phone: '+974 5500 2222',
    avatar: 'https://ui-avatars.com/api/?name=Sarah+Chen&background=random'
  },
  {
    id: 'QNC-TECH-0004',
    name: 'Mike Ross',
    status: 'BUSY',
    role: 'Technician',
    systemRole: Role.FIELD_ENGINEER,
    isActive: true,
    level: 'FIELD_ENGINEER',
    email: 'mike@qonnect.com',
    phone: '+974 5500 3333',
    avatar: 'https://ui-avatars.com/api/?name=Mike+Ross&background=random'
  }
];

export const MOCK_TEAMS: Team[] = [
  {
    id: 'team_alpha',
    name: 'Team Alpha',
    leadId: 'QNC-TECH-0002', 
    memberIds: ['QNC-TECH-0004'],
    status: 'DEPLOYED',
    currentSiteId: 'site_1',
    workloadLevel: 'HIGH'
  },
  {
    id: 'team_beta',
    name: 'Team Beta',
    leadId: 'QNC-TECH-0002', // Re-using T2 as example lead
    memberIds: ['QNC-TECH-0003'], 
    status: 'AVAILABLE',
    workloadLevel: 'LOW'
  }
];

export const MOCK_SITES: Site[] = [
  {
    id: 'site_1',
    name: 'Villa 17 - Smart Install',
    clientName: 'Sheikh Ahmed',
    location: 'The Pearl, Q2',
    priority: Priority.HIGH,
    status: 'ACTIVE',
    assignedTeamId: 'team_alpha',
    startTime: new Date().toISOString()
  },
  {
    id: 'site_2',
    name: 'Doha Tower Office',
    clientName: 'Tech Corp',
    location: 'West Bay',
    priority: Priority.MEDIUM,
    status: 'PLANNED',
    assignedTeamId: undefined
  },
  {
    id: 'site_3',
    name: 'Al Sadd Mall - CCTV',
    clientName: 'Mall Management',
    location: 'Al Sadd',
    priority: Priority.URGENT,
    status: 'ACTIVE',
    assignedTeamId: undefined
  }
];

export const MOCK_CUSTOMERS: Customer[] = [
  { id: 'QNC-CUST-0001', name: 'Alice Springer', phone: '+97455101010', email: 'alice@example.com', address: '123 Maple St', avatar: 'https://ui-avatars.com/api/?name=Alice+Springer&background=random' },
  { id: 'QNC-CUST-0002', name: 'Bob Kramer', phone: '+97466202020', email: 'bob@example.com', address: '456 Oak Ave', avatar: 'https://ui-avatars.com/api/?name=Bob+Kramer&background=random' },
  { id: 'QNC-CUST-0003', name: 'Charlie Day', phone: '+97433303030', email: 'charlie@example.com', address: '789 Pine Ln', avatar: 'https://ui-avatars.com/api/?name=Charlie+Day&background=random' },
];

const now = new Date();
const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

export const TICKET_CATEGORIES = [
  'Wi-Fi & Networking',
  'CCTV',
  'Light Automation',
  'Intercom',
  'Smart Speaker'
];

export const MOCK_TICKETS: Ticket[] = [
  {
    id: 'QNC-TK-000001', 
    customerId: 'QNC-CUST-0001',
    customerName: 'Alice Springer',
    phoneNumber: '+97455101010',
    category: 'Wi-Fi & Networking',
    type: TicketType.WARRANTY,
    priority: Priority.HIGH,
    status: TicketStatus.NEW,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    unreadCount: 1,
    messages: [
      { id: 'm1', sender: MessageSender.CLIENT, content: 'My internet is completely down since this morning.', timestamp: now.toISOString() }
    ]
  },
  {
    id: 'QNC-TK-000002', 
    customerId: 'QNC-CUST-0002',
    customerName: 'Bob Kramer',
    phoneNumber: '+97466202020',
    category: 'CCTV',
    type: TicketType.AMC,
    priority: Priority.MEDIUM,
    status: TicketStatus.IN_PROGRESS,
    assignedTechId: 'QNC-TECH-0003', 
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString(),
    unreadCount: 0,
    appointmentTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
    messages: [
      { id: 'm2', sender: MessageSender.CLIENT, content: 'Camera 3 is offline.', timestamp: yesterday.toISOString() },
      { id: 'm3', sender: MessageSender.AGENT, content: 'We are sending a technician to check the connections.', timestamp: yesterday.toISOString() }
    ]
  },
  {
    id: 'QNC-TK-000003', 
    customerId: 'QNC-CUST-0003',
    customerName: 'Charlie Day',
    phoneNumber: '+97433303030',
    category: 'Light Automation',
    type: TicketType.CHARGEABLE,
    priority: Priority.LOW,
    status: TicketStatus.OPEN,
    createdAt: threeDaysAgo.toISOString(),
    updatedAt: threeDaysAgo.toISOString(),
    unreadCount: 0,
    messages: [
      { id: 'm4', sender: MessageSender.CLIENT, content: 'Living room dimmer is stuck.', timestamp: threeDaysAgo.toISOString() }
    ]
  }
];

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: 'QNC-ACT-000001', 
    reference: 'QNC-ACT-000001',
    type: 'Installation',
    siteId: 'site_1',
    customerId: 'QNC-CUST-0001',
    priority: Priority.HIGH,
    status: 'IN_PROGRESS',
    plannedDate: now.toISOString(),
    durationHours: 4,
    assignedTeamId: 'team_alpha',
    salesLeadId: 'QNC-TECH-0001', 
    leadTechId: 'QNC-TECH-0002', 
    assistantTechIds: ['QNC-TECH-0004'], 
    description: 'Full Smart Home setup installation phase 1.',
    createdAt: yesterday.toISOString(),
    updatedAt: now.toISOString()
  },
  {
    id: 'QNC-ACT-000002',
    reference: 'QNC-ACT-000002',
    type: 'Survey',
    siteId: 'site_2',
    customerId: 'QNC-CUST-0002',
    priority: Priority.MEDIUM,
    status: 'PLANNED',
    plannedDate: tomorrow.toISOString(),
    durationHours: 2,
    assignedTeamId: 'team_beta',
    salesLeadId: 'QNC-TECH-0003', 
    leadTechId: 'QNC-TECH-0003', 
    assistantTechIds: [],
    description: 'Site survey for new CCTV upgrade requirement.',
    createdAt: yesterday.toISOString(),
    updatedAt: yesterday.toISOString()
  }
];
