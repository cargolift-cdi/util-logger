export interface ApplicationInfo {
  module: string;
  function: string;
  action: string;
  resource_id?: string; // Opcional, pois nem sempre existirá
}

export interface CallerInfo {
  type: 'user' | 'api' | 'system';
  id: string;
  details?: {
    name?: string;
    email?: string;
  };
}

export interface TraceStep {
  timestamp: string;
  name: string;
}

export interface CargoliftLogContext {
  correlationId: string;
  trace_string: string;
  trace: TraceStep[]; // <-- Alterado para um array para suportar múltiplos passos
  application: ApplicationInfo;
  caller: CallerInfo;
}

export type ErrorType = 'businessError' | 'application' | 'none';