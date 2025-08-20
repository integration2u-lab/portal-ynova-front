import React from 'react';

export default function AgendaPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agenda</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Agendar Apresentação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cliente</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
              <option>Selecionar cliente...</option>
              <option>Empresa Alpha Ltda</option>
              <option>Beta Comércio SA</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Duração</label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500">
              <option>30 minutos</option>
              <option>45 minutos</option>
              <option>60 minutos</option>
            </select>
          </div>
        </div>

        <h4 className="font-medium text-gray-900 mb-3">Horários Sugeridos</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {['Hoje 14:00','Amanhã 09:00','Amanhã 15:00','19/01 10:00','19/01 16:00','20/01 09:30','20/01 14:00','21/01 11:00'].map((horario, i) => (
            <button key={i} className="p-3 border border-gray-300 rounded-lg text-sm hover:border-orange-500 hover:bg-orange-50 transition-colors">
              {horario}
            </button>
          ))}
        </div>

        <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium">
          Confirmar Agendamento
        </button>
      </div>

      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Compromissos</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="font-medium">Apresentação - Empresa Alpha</p>
              <p className="text-sm text-gray-600">18/01/2025 às 14:00</p>
            </div>
            <button className="text-orange-600 hover:text-orange-700 text-sm">Reagendar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
