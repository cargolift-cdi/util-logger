export interface ApplicationInfo {
    name: string;
    function?: string;
    action?: string;
    resource_id?: string;
}
export interface CallerInfo {
    type: 'user' | 'api' | 'system';
    id?: string;
    details?: {
        name?: string;
        email?: string;
    };
}
export interface LogTrace {
    timestamp: string;
    name: string;
}
export interface Error {
    type: ErrorType;
    code: string;
    message: string;
    stack_trace?: string;
}
export interface LogContext {
    correlation_id?: string;
    trace?: LogTrace[];
    application?: ApplicationInfo;
    caller_info?: CallerInfo;
    error?: Error;
}
export type ErrorType = 'business' | 'application' | 'none';
