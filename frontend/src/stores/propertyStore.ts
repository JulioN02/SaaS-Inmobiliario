/* =============================================================================
   SaaS Inmobiliario — Property Store (Zustand)
   ============================================================================= */

import { create } from 'zustand';
import type {
  Property,
  CreatePropertyDto,
  UpdatePropertyDto,
  FindAllPropertiesParams,
  PaginatedProperties,
} from '../types/property';
import {
  findAllProperties,
  findPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
} from '../services/property';

interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  totalPages: number;
  limit: number;

  fetchProperties: (params?: FindAllPropertiesParams) => Promise<void>;
  fetchPropertyById: (id: string) => Promise<void>;
  createProperty: (dto: CreatePropertyDto) => Promise<Property>;
  updateProperty: (id: string, dto: UpdatePropertyDto) => Promise<Property>;
  deleteProperty: (id: string) => Promise<void>;
  setSelectedProperty: (property: Property | null) => void;
  clearError: () => void;
}

export const usePropertyStore = create<PropertyState>((set) => ({
  properties: [],
  selectedProperty: null,
  loading: false,
  error: null,
  total: 0,
  page: 1,
  totalPages: 1,
  limit: 10,

  fetchProperties: async (params?: FindAllPropertiesParams) => {
    set({ loading: true, error: null });
    try {
      const result: PaginatedProperties = await findAllProperties(params);
      set({
        properties: result.data,
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
        limit: result.limit,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar propiedades';
      set({ error: message, loading: false });
    }
  },

  fetchPropertyById: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const property = await findPropertyById(id);
      set({ selectedProperty: property, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar propiedad';
      set({ error: message, loading: false });
    }
  },

  createProperty: async (dto: CreatePropertyDto) => {
    set({ loading: true, error: null });
    try {
      const property = await createProperty(dto);
      set((state) => ({
        properties: [property, ...state.properties],
        total: state.total + 1,
        loading: false,
      }));
      return property;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al crear propiedad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateProperty: async (id: string, dto: UpdatePropertyDto) => {
    set({ loading: true, error: null });
    try {
      const property = await updateProperty(id, dto);
      set((state) => ({
        properties: state.properties.map((p) => (p.id === id ? property : p)),
        selectedProperty: state.selectedProperty?.id === id ? property : state.selectedProperty,
        loading: false,
      }));
      return property;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al actualizar propiedad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteProperty: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await deleteProperty(id);
      set((state) => ({
        properties: state.properties.filter((p) => p.id !== id),
        selectedProperty: state.selectedProperty?.id === id ? null : state.selectedProperty,
        total: state.total - 1,
        loading: false,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al eliminar propiedad';
      set({ error: message, loading: false });
      throw err;
    }
  },

  setSelectedProperty: (property) => set({ selectedProperty: property }),

  clearError: () => set({ error: null }),
}));