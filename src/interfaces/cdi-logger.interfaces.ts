// src/interfaces/cdi-logger.interfaces.ts

export type ErrorType = 'businessError' | 'application' | 'none';

export interface Trace {
  timestamp: string;
  name: string;
}

export interface ApplicationContext {
  module: string;
  function: string;
  action: string;
  resource_id?: string | number;
}

export interface CallerDetails {
  name?: string;
  email?: string;
}

export interface CallerContext {
  type: 'user' | 'api' | 'system';
  id: string;
  details?: CallerDetails;
}

export interface CdiLoggerContext {
  correlationId: string;
  trace: Trace;
  application: ApplicationContext;
  caller: CallerContext;
  trace_string?: string; // Será construído dinamicamente
}