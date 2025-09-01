import { LoggerService } from '@nestjs/common';
export declare class CargoliftCDILogger implements LoggerService {
    private pinoLogger;
    private context;
    constructor();
    setContext(context: Record<string, any>): void;
    addTraceStep(name: string): void;
    private mergePayload;
    log(message: string, context?: Record<string, any>): void;
    info(message: string, context?: Record<string, any>): void;
    error(message: string, traceOrContext?: string | Record<string, any>, context?: Record<string, any>): void;
    warn(message: string, context?: Record<string, any>): void;
    debug?(message: string, context?: Record<string, any>): void;
    verbose?(message: string, context?: Record<string, any>): void;
    businessError(message: string, context: Record<string, any>): void;
}
