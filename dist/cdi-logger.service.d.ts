import { LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CdiLoggerContext, ErrorType } from './interfaces/cdi-logger.interfaces';
export declare class CdiLoggerService implements LoggerService {
    private readonly pinoLogger;
    private context;
    private traceHistory;
    constructor(pinoLogger: PinoLogger);
    setContext(context: CdiLoggerContext): void;
    addTraceStep(name: string): void;
    private updateTraceString;
    private mergePayload;
    log(message: string, payload?: Record<string, any>): void;
    info(message: string, payload?: Record<string, any>): void;
    error(message: string, traceOrPayload?: string | Record<string, any>, errorType?: ErrorType): void;
    warn(message: string, payload?: Record<string, any>): void;
    debug(message: string, payload?: Record<string, any>): void;
    verbose(message: string, payload?: Record<string, any>): void;
}
