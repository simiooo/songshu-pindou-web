import { create } from 'zustand';
import type { LLMProvider } from '@/types/editor';
import {
  saveLLMProvider as saveLLMProviderToDb,
  deleteLLMProvider as deleteLLMProviderFromDb,
  getAllLLMProviders as getAllLLMProvidersFromDb,
  type LLMProviderRecord,
} from '@/utils/dexieDb';

interface LLMProviderStore {
  providers: LLMProvider[];
  activeProviderId: string | null;
  imageProcessorId: string | null;
  isLoading: boolean;

  // Actions
  addProvider: (
    provider: Omit<LLMProvider, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<LLMProvider>;
  updateProvider: (id: string, updates: Partial<LLMProvider>) => Promise<void>;
  deleteProvider: (id: string) => Promise<void>;
  setActiveProvider: (id: string) => void;
  getActiveProvider: () => LLMProvider | null;
  getImageProcessor: () => LLMProvider | null;
  setImageProcessor: (id: string) => Promise<void>;
  listProviders: () => LLMProvider[];
  getEnabledProviders: () => LLMProvider[];
  loadFromStorage: () => Promise<void>;
}

const generateId = () => `provider_${Math.random().toString(36).substring(2, 11)}`;

// Convert LLMProvider to database record
function toDbRecord(provider: LLMProvider): LLMProviderRecord {
  return {
    uuid: provider.id,
    name: provider.name,
    provider: provider.provider,
    model: provider.model,
    apiKey: provider.apiKey,
    baseUrl: provider.baseUrl,
    enabled: provider.enabled,
    isDefault: provider.isDefault,
    isImageProcessor: provider.isImageProcessor,
    reasoningLevel: provider.reasoningLevel,
    maxTokens: provider.maxTokens,
    maxContextWindow: provider.maxContextWindow,
    temperature: provider.temperature,
    topP: provider.topP,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

// Convert database record to LLMProvider
function fromDbRecord(record: LLMProviderRecord): LLMProvider {
  return {
    id: record.uuid,
    name: record.name,
    provider: record.provider as LLMProvider['provider'],
    model: record.model,
    apiKey: record.apiKey,
    baseUrl: record.baseUrl,
    enabled: record.enabled,
    isDefault: record.isDefault,
    isImageProcessor: record.isImageProcessor,
    reasoningLevel: record.reasoningLevel,
    maxTokens: record.maxTokens,
    maxContextWindow: record.maxContextWindow,
    temperature: record.temperature,
    topP: record.topP,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export const useLLMProviderStore = create<LLMProviderStore>((set, get) => ({
  providers: [],
  activeProviderId: null,
  imageProcessorId: null,
  isLoading: false,

  loadFromStorage: async () => {
    set({ isLoading: true });
    try {
      const records = await getAllLLMProvidersFromDb();
      const providers = records.map(fromDbRecord);
      
      // Find default provider for active
      const defaultProvider = providers.find((p) => p.isDefault);
      const activeProviderId = defaultProvider?.id ?? (providers.length > 0 ? providers[0].id : null);
      
      // Find image processor
      const imageProcessor = providers.find((p) => p.isImageProcessor);
      const imageProcessorId = imageProcessor?.id ?? null;

      set({
        providers,
        activeProviderId,
        imageProcessorId,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  addProvider: async (providerData) => {
    const now = Date.now();
    const newProvider: LLMProvider = {
      ...providerData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

    // Save to database first
    await saveLLMProviderToDb(toDbRecord(newProvider));

    set((state) => {
      let newProviders = [...state.providers, newProvider];

      if (newProvider.isDefault) {
        newProviders = newProviders.map((p) =>
          p.id === newProvider.id ? p : { ...p, isDefault: false }
        );
      }

      if (newProvider.isImageProcessor) {
        newProviders = newProviders.map((p) =>
          p.id === newProvider.id ? p : { ...p, isImageProcessor: false }
        );
      }

      if (newProviders.length === 1 || newProvider.isDefault) {
        return {
          providers: newProviders,
          activeProviderId: newProvider.id,
        };
      }

      return { providers: newProviders };
    });

    return newProvider;
  },

  updateProvider: async (id, updates) => {
    const { providers } = get();
    const provider = providers.find((p) => p.id === id);
    
    if (!provider) return;

    const updatedProvider: LLMProvider = {
      ...provider,
      ...updates,
      updatedAt: Date.now(),
    };

    // Save to database
    await saveLLMProviderToDb(toDbRecord(updatedProvider));

    set((state) => {
      let newProviders = state.providers.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
      );

      if (updates.isDefault) {
        newProviders = newProviders.map((p) =>
          p.id === id ? p : { ...p, isDefault: false }
        );
      }

      if (updates.isImageProcessor) {
        newProviders = newProviders.map((p) =>
          p.id === id ? p : { ...p, isImageProcessor: false }
        );
      }

      return { providers: newProviders };
    });

    if (updates.isImageProcessor) {
      set({ imageProcessorId: id });
    }
  },

  deleteProvider: async (id) => {
    // Delete from database
    await deleteLLMProviderFromDb(id);

    set((state) => {
      const newProviders = state.providers.filter((p) => p.id !== id);
      let newActiveId = state.activeProviderId;
      let newImageProcessorId = state.imageProcessorId;

      if (state.activeProviderId === id) {
        newActiveId = newProviders.length > 0 ? newProviders[0].id : null;
      }

      if (state.imageProcessorId === id) {
        newImageProcessorId = null;
      }

      return {
        providers: newProviders,
        activeProviderId: newActiveId,
        imageProcessorId: newImageProcessorId,
      };
    });
  },

  setActiveProvider: (id) => {
    const { providers } = get();
    const provider = providers.find((p) => p.id === id);

    if (provider && provider.enabled) {
      set({ activeProviderId: id });
    }
  },

  getActiveProvider: () => {
    const { providers, activeProviderId } = get();
    return providers.find((p) => p.id === activeProviderId) ?? null;
  },

  getImageProcessor: () => {
    const { providers, imageProcessorId } = get();
    return providers.find((p) => p.id === imageProcessorId && p.isImageProcessor) ?? null;
  },

  setImageProcessor: async (id) => {
    const { providers, updateProvider } = get();
    const provider = providers.find((p) => p.id === id);

    if (provider && provider.enabled) {
      // Update all providers in state
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id
            ? { ...p, isImageProcessor: true, updatedAt: Date.now() }
            : { ...p, isImageProcessor: false }
        ),
        imageProcessorId: id,
      }));

      // Update the specific provider in database
      await updateProvider(id, { isImageProcessor: true });
    }
  },

  listProviders: () => get().providers,

  getEnabledProviders: () => get().providers.filter((p) => p.enabled),
}));

// Initialize store from dexie on app startup
export function initLLMProviderStore(): Promise<void> {
  return useLLMProviderStore.getState().loadFromStorage();
}
