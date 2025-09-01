"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoliftCDILogger = void 0;
const common_1 = require("@nestjs/common");
const pino_1 = __importDefault(require("pino"));
let CargoliftCDILogger = class CargoliftCDILogger {
    constructor() {
        this.context = {};
        const transportOptions = {
            target: 'pino-pretty',
            options: {
                colorize: true,
                levelFirst: true,
                translateTime: 'UTC:dd/mm/yyyy HH:MM:ss.l'
            }
        };
        this.pinoLogger = (0, pino_1.default)({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV !== 'production' ? transportOptions : undefined,
        });
    }
    setContext(context) {
        const requiredFields = [
            'correlationId',
            'application.module',
            'application.function',
            'application.action',
            'caller.type',
            'caller.id',
        ];
        for (const field of requiredFields) {
            const keys = field.split('.');
            let current = context;
            let path = '';
            for (const key of keys) {
                path = path ? `${path}.${key}` : key;
                if (current[key] === undefined || current[key] === null) {
                    throw new Error(`[CargoliftCDILogger] Campo obrigatório ausente no contexto: ${path}`);
                }
                current = current[key];
            }
        }
        this.context = Object.assign(this.context, context);
        if (!this.context.trace)
            this.context.trace = [];
        if (!this.context.trace_string)
            this.context.trace_string = '';
    }
    addTraceStep(name) {
        if (!this.context.trace) {
            this.context.trace = [];
        }
        const step = {
            name,
            timestamp: new Date().toISOString(),
        };
        this.context.trace.push(step);
        this.context.trace_string = this.context.trace.map(t => t.name).join(' -> ');
    }
    mergePayload(message, payload = {}, errorType = 'none') {
        const finalPayload = {
            ...this.context,
            ...payload,
            errorType,
        };
        return { finalPayload, message };
    }
    log(message, context) {
        const { finalPayload } = this.mergePayload(message, context);
        this.pinoLogger.info(finalPayload, message);
    }
    info(message, context) {
        this.log(message, context);
    }
    error(message, traceOrContext, context) {
        let payload = {};
        if (typeof traceOrContext === 'object' && traceOrContext !== null) {
            payload = { ...payload, ...traceOrContext };
        }
        else if (typeof traceOrContext === 'string') {
            payload.stackTrace = traceOrContext;
        }
        if (typeof context === 'object' && context !== null) {
            payload = { ...payload, ...context };
        }
        const isBusinessError = payload.errorType === 'businessError';
        const errorType = isBusinessError ? 'businessError' : 'application';
        const { finalPayload } = this.mergePayload(message, payload, errorType);
        this.pinoLogger.error(finalPayload, message);
    }
    warn(message, context) {
        const { finalPayload } = this.mergePayload(message, context);
        this.pinoLogger.warn(finalPayload, message);
    }
    debug(message, context) {
        const { finalPayload } = this.mergePayload(message, context);
        this.pinoLogger.debug(finalPayload, message);
    }
    verbose(message, context) {
        const { finalPayload } = this.mergePayload(message, context);
        this.pinoLogger.trace(finalPayload, message);
    }
    businessError(message, context) {
        this.error(message, { ...context, errorType: 'businessError' });
    }
};
exports.CargoliftCDILogger = CargoliftCDILogger;
exports.CargoliftCDILogger = CargoliftCDILogger = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [])
], CargoliftCDILogger);
//# sourceMappingURL=cargolift-logger.service.js.map