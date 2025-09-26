/**
 * Lead Status Configuration - Frontend
 * 
 * This file defines the configuration for lead statuses in the frontend.
 * It should be kept in sync with the backend status configuration.
 */

// Default status values - these can be modified as needed
export const DEFAULT_LEAD_STATUSES = {
  NOVO: 'novo',
  QUALIFICADO: 'qualificado', 
  PROPOSTA: 'proposta',
  NEGOCIACAO: 'negociacao',
  FECHADO: 'fechado'
} as const;

// Status categories for different business logic
export const STATUS_CATEGORIES = {
  // Statuses that are considered "active" (not closed)
  ACTIVE: [
    DEFAULT_LEAD_STATUSES.NOVO,
    DEFAULT_LEAD_STATUSES.QUALIFICADO,
    DEFAULT_LEAD_STATUSES.PROPOSTA,
    DEFAULT_LEAD_STATUSES.NEGOCIACAO
  ],
  
  // Statuses that are considered "closed" (final states)
  CLOSED: [
    DEFAULT_LEAD_STATUSES.FECHADO
  ],
  
  // Statuses that represent leads in negotiation phase
  NEGOTIATION: [
    DEFAULT_LEAD_STATUSES.NEGOCIACAO
  ]
} as const;

// Helper functions to work with statuses
export const StatusUtils = {
  /**
   * Check if a status is considered active
   */
  isActiveStatus: (status: string): boolean => {
    return STATUS_CATEGORIES.ACTIVE.includes(status as any);
  },

  /**
   * Check if a status is considered closed
   */
  isClosedStatus: (status: string): boolean => {
    return STATUS_CATEGORIES.CLOSED.includes(status as any);
  },

  /**
   * Check if a status is in negotiation phase
   */
  isNegotiationStatus: (status: string): boolean => {
    return STATUS_CATEGORIES.NEGOTIATION.includes(status as any);
  },

  /**
   * Get all valid statuses (combines active and closed)
   */
  getAllValidStatuses: (): string[] => {
    return [...STATUS_CATEGORIES.ACTIVE, ...STATUS_CATEGORIES.CLOSED];
  },

  /**
   * Get active statuses for filtering
   */
  getActiveStatuses: (): string[] => {
    return [...STATUS_CATEGORIES.ACTIVE];
  },

  /**
   * Get closed statuses for filtering
   */
  getClosedStatuses: (): string[] => {
    return [...STATUS_CATEGORIES.CLOSED];
  },

  /**
   * Get negotiation statuses for filtering
   */
  getNegotiationStatuses: (): string[] => {
    return [...STATUS_CATEGORIES.NEGOTIATION];
  }
};

// Export types for TypeScript
export type LeadStatus = typeof DEFAULT_LEAD_STATUSES[keyof typeof DEFAULT_LEAD_STATUSES];
export type StatusCategory = keyof typeof STATUS_CATEGORIES;
