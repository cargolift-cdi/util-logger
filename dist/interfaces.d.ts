export interface ApplicationInfo {
    module: string;
    function: string;
    action: string;
    resource_id?: string;
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
    trace: TraceStep[];
    application: ApplicationInfo;
    caller: CallerInfo;
}
export type ErrorType = 'businessError' | 'application' | 'none';
