import { PinoLogger } from 'nestjs-pino';
export declare class CargoliftCDILogger {
    private readonly logger;
    private context;
    constructor(logger: PinoLogger);
    setContext(context: Record<string, any>): void;
    info(message: string, data?: Record<string, any>, ...args: any[]): void;
    error(error: Error, message?: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    businessError(message: string, details?: any): void;
    criticalError(message: string, details?: any): void;
}
//# sourceMappingURL=cargolift-cdi-logger.service.d.ts.map