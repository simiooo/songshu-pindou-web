import { create } from 'zustand';
import type { LLMProvider } from '@/types/editor';

interface LLMProviderStore {
  providers: LLMProvider[];
  activeProviderId: string | null;
  imageProcessorId: string | null;

  addProvider: (
    provider: Omit<LLMProvider, 'id' | 'createdAt' | 'updatedAt'>
  ) => LLMProvider;
  updateProvider: (id: string, updates: Partial<LLMProvider>) => void;
  deleteProvider: (id: string) => void;
  setActiveProvider: (id: string) => void;
  getActiveProvider: () => LLMProvider | null;
  getImageProcessor: () => LLMProvider | null;
  setImageProcessor: (id: string) => void;
  listProviders: () => LLMProvider[];
  getEnabledProviders: () => LLMProvider[];
}

const generateId = () => `provider_${Math.random().toString(36).substring(2, 11)}`;

export const useLLMProviderStore = create<LLMProviderStore>((set, get) => ({
  providers: [],
  activeProviderId: null,
  imageProcessorId: null,

  addProvider: (providerData) => {
    const now = Date.now();
    const newProvider: LLMProvider = {
      ...providerData,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };

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

  updateProvider: (id, updates) => {
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

  deleteProvider: (id) => {
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

  setImageProcessor: (id) => {
    const { providers } = get();
    const provider = providers.find((p) => p.id === id);

    if (provider && provider.enabled) {
      set((state) => ({
        providers: state.providers.map((p) =>
          p.id === id
            ? { ...p, isImageProcessor: true, updatedAt: Date.now() }
            : { ...p, isImageProcessor: false }
        ),
        imageProcessorId: id,
      }));
    }
  },

  listProviders: () => get().providers,

  getEnabledProviders: () => get().providers.filter((p) => p.enabled),
}));
