import Dexie, { type Table } from 'dexie';
import type { CanvasSize, CanvasData } from '@/types/editor';

export interface ProjectRecord {
  id?: number;
  uuid: string;
  name: string;
  canvasSize: CanvasSize;
  canvasData: CanvasData;
  activeColorGroupId: string;
  thumbnail: string;
  createdAt: number;
  updatedAt: number;
}

export interface LLMProviderRecord {
  id?: number;
  uuid: string;
  name: string;
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  enabled: boolean;
  isDefault: boolean;
  isImageProcessor: boolean;
  reasoningLevel?: string;
  maxTokens?: number;
  maxContextWindow?: number;
  temperature?: number;
  topP?: number;
  createdAt: number;
  updatedAt: number;
}

export interface CustomColorGroupRecord {
  id?: number;
  uuid: string;
  name: string;
  brand: string;
  beadSize: string;
  category: string;
  colors: { code: string; hex: string; name?: string }[];
  createdAt: number;
  updatedAt: number;
}

class PerlerBeadsDB extends Dexie {
  projects!: Table<ProjectRecord>;
  llmProviders!: Table<LLMProviderRecord>;
  customColorGroups!: Table<CustomColorGroupRecord>;

  constructor() {
    super('PerlerBeadsDB');

    this.version(1).stores({
      projects: '++id, uuid, name, createdAt, updatedAt',
      llmProviders: '++id, uuid, name, createdAt, updatedAt',
      customColorGroups: '++id, uuid, name, createdAt, updatedAt',
    });
  }
}

export const db = new PerlerBeadsDB();

export async function saveProject(project: Omit<ProjectRecord, 'id'>): Promise<string> {
  const existing = await db.projects.where('uuid').equals(project.uuid).first();

  if (existing) {
    await db.projects.update(existing.id!, {
      ...project,
      updatedAt: Date.now(),
    });
  } else {
    await db.projects.add(project);
  }

  return project.uuid;
}

export async function loadProject(uuid: string): Promise<ProjectRecord | undefined> {
  return db.projects.where('uuid').equals(uuid).first();
}

export async function listProjects(): Promise<ProjectRecord[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function deleteProject(uuid: string): Promise<void> {
  await db.projects.where('uuid').equals(uuid).delete();
}

export async function getAllLLMProviders(): Promise<LLMProviderRecord[]> {
  return db.llmProviders.toArray();
}

export async function saveLLMProvider(provider: Omit<LLMProviderRecord, 'id'>): Promise<string> {
  const existing = await db.llmProviders.where('uuid').equals(provider.uuid).first();

  if (existing) {
    await db.llmProviders.update(existing.id!, {
      ...provider,
      updatedAt: Date.now(),
    });
  } else {
    await db.llmProviders.add(provider);
  }

  return provider.uuid;
}

export async function deleteLLMProvider(uuid: string): Promise<void> {
  await db.llmProviders.where('uuid').equals(uuid).delete();
}

export async function saveCustomColorGroup(
  group: Omit<CustomColorGroupRecord, 'id'>
): Promise<string> {
  const existing = await db.customColorGroups.where('uuid').equals(group.uuid).first();

  if (existing) {
    await db.customColorGroups.update(existing.id!, {
      ...group,
      updatedAt: Date.now(),
    });
  } else {
    await db.customColorGroups.add(group);
  }

  return group.uuid;
}

export async function getCustomColorGroups(): Promise<CustomColorGroupRecord[]> {
  return db.customColorGroups.toArray();
}

export async function deleteCustomColorGroup(uuid: string): Promise<void> {
  await db.customColorGroups.where('uuid').equals(uuid).delete();
}
