import { LoggerService } from '@nestjs/common';
import { LogContext } from './logger.interface';
export declare class LoggerContextService implements LoggerService {
    private pinoLogger;
    private context;
    constructor();
    setContext(context: LogContext, req?: Request): void;
    private buildLog;
    info(message: string, extraContext?: Record<string, any>): void;
    log(message: any, ...optionalParams: any[]): void;
    error(message: string, error?: Record<string, any>, extraContext?: Record<string, any>): void;
    warn(message: any, ...optionalParams: any[]): void;
    businessError(message: string, extraContext?: Record<string, any>): void;
}
