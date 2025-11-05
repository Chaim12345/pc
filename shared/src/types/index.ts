// User types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  isTwoFactorEnabled?: boolean;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Organization types
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum OrganizationRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
  VIEWER = 'VIEWER'
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrganizationRole;
  user?: User;
}

// Board types
export interface Board {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  groups?: Group[];
  columns?: Column[];
}

export interface Group {
  id: string;
  boardId: string;
  title: string;
  position: number;
  items?: Item[];
}

export interface Item {
  id: string;
  boardId: string;
  groupId: string;
  name: string;
  position: number;
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
  columnValues?: ColumnValue[];
  comments?: Comment[];
  attachments?: Attachment[];
  subitems?: Item[];
}

// Column types
export enum ColumnType {
  STATUS = 'STATUS',
  TEXT = 'TEXT',
  LONG_TEXT = 'LONG_TEXT',
  NUMBER = 'NUMBER',
  RATING = 'RATING',
  DATE = 'DATE',
  PEOPLE = 'PEOPLE',
  FILES = 'FILES',
  CHECKBOX = 'CHECKBOX',
  TIMELINE = 'TIMELINE',
  LINK = 'LINK',
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
  LOCATION = 'LOCATION',
  TAGS = 'TAGS',
  PRIORITY = 'PRIORITY'
}

export interface Column {
  id: string;
  boardId: string;
  title: string;
  type: ColumnType;
  position: number;
  settings?: ColumnSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface ColumnSettings {
  [key: string]: any;
  // Status column settings
  labels?: { id: string; label: string; color: string }[];
  // Rating settings
  maxRating?: number;
  // People settings
  multiple?: boolean;
  // Date settings
  includeTime?: boolean;
  // Timeline settings
  startDateColumnId?: string;
  endDateColumnId?: string;
}

export interface ColumnValue {
  id: string;
  itemId: string;
  columnId: string;
  value: any;
  createdAt: Date;
  updatedAt: Date;
}

// Comment types
export interface Comment {
  id: string;
  itemId: string;
  userId: string;
  text: string;
  parentId?: string;
  mentions?: string[];
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  replies?: Comment[];
}

// Attachment types
export interface Attachment {
  id: string;
  itemId: string;
  userId: string;
  filename: string;
  filepath: string;
  mimeType: string;
  size: number;
  createdAt: Date;
}

// Automation types
export enum AutomationTriggerType {
  ITEM_CREATED = 'ITEM_CREATED',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_DELETED = 'ITEM_DELETED',
  COLUMN_VALUE_CHANGED = 'COLUMN_VALUE_CHANGED',
  DATE_REACHED = 'DATE_REACHED',
  STATUS_CHANGED = 'STATUS_CHANGED'
}

export enum AutomationActionType {
  UPDATE_COLUMN_VALUE = 'UPDATE_COLUMN_VALUE',
  CREATE_ITEM = 'CREATE_ITEM',
  SEND_NOTIFICATION = 'SEND_NOTIFICATION',
  MOVE_TO_GROUP = 'MOVE_TO_GROUP',
  CHANGE_STATUS = 'CHANGE_STATUS'
}

export interface Automation {
  id: string;
  boardId: string;
  name: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AutomationTrigger {
  type: AutomationTriggerType;
  conditions?: Record<string, any>;
}

export interface AutomationAction {
  type: AutomationActionType;
  parameters?: Record<string, any>;
}

// Dashboard types
export enum WidgetType {
  NUMBERS = 'NUMBERS',
  CHART = 'CHART',
  CLOCK = 'CLOCK',
  BOARD = 'BOARD',
  TEXT = 'TEXT'
}

export interface Dashboard {
  id: string;
  organizationId: string;
  name: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  itemId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  duration?: number; // in seconds
  description?: string;
  user?: User;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Workdoc types
export interface Workdoc {
  id: string;
  title: string;
  content: string;
  organizationId: string;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  creator?: User;
}

// Socket event types
export enum SocketEvent {
  // Client -> Server
  JOIN_BOARD = 'JOIN_BOARD',
  LEAVE_BOARD = 'LEAVE_BOARD',
  ITEM_UPDATED = 'ITEM_UPDATED',
  ITEM_CREATED = 'ITEM_CREATED',
  ITEM_DELETED = 'ITEM_DELETED',
  COLUMN_UPDATED = 'COLUMN_UPDATED',
  GROUP_UPDATED = 'GROUP_UPDATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  
  // Server -> Client
  BOARD_UPDATED = 'BOARD_UPDATED',
  ITEM_CHANGED = 'ITEM_CHANGED',
  COLUMN_CHANGED = 'COLUMN_CHANGED',
  GROUP_CHANGED = 'GROUP_CHANGED',
  COMMENT_CREATED = 'COMMENT_CREATED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  PRESENCE_UPDATE = 'PRESENCE_UPDATE',
  NOTIFICATION_NEW = 'NOTIFICATION_NEW'
}

export interface SocketMessage {
  event: SocketEvent;
  data: any;
  timestamp: Date;
}

