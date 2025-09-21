import React, { createContext, useContext, useState, ReactNode } from 'react';

interface AddNegociacaoContextType {
  isModalOpen: boolean;
  openModal: (stage: string) => void;
  closeModal: () => void;
  modalStage: string;
}

const AddNegociacaoContext = createContext<AddNegociacaoContextType | undefined>(undefined);

interface AddNegociacaoProviderProps {
  children: ReactNode;
}

export function AddNegociacaoProvider({ children }: AddNegociacaoProviderProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState('novo');

  const openModal = (stage: string) => {
    setModalStage(stage);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  return (
    <AddNegociacaoContext.Provider value={{
      isModalOpen,
      openModal,
      closeModal,
      modalStage
    }}>
      {children}
    </AddNegociacaoContext.Provider>
  );
}

export function useAddNegociacao() {
  const context = useContext(AddNegociacaoContext);
  if (context === undefined) {
    throw new Error('useAddNegociacao must be used within an AddNegociacaoProvider');
  }
  return context;
}
