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
exports.LoggerContextService = void 0;
const common_1 = require("@nestjs/common");
const pino_1 = __importDefault(require("pino"));
const uuid_1 = require("uuid");
let LoggerContextService = class LoggerContextService {
    constructor() {
        this.context = {};
        const transportOptions = {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'UTC:dd/mm/yyyy HH:MM:ss.l',
            }
        };
        this.pinoLogger = (0, pino_1.default)({
            level: process.env.LOG_LEVEL || 'info',
            transport: process.env.NODE_ENV !== 'production' ? transportOptions : undefined,
        });
    }
    setContext(context, req) {
        let trace = [];
        const xTrace = req?.headers['x-trace'];
        const xCorrelation = req?.headers['x-correlation-id'];
        if (xTrace) {
            try {
                const traceObj = typeof xTrace === 'string' ? JSON.parse(xTrace) : xTrace;
                if (typeof traceObj === 'object' && traceObj !== null) {
                    trace.push(traceObj);
                }
            }
            catch (e) {
                trace = [];
            }
        }
        trace.push({
            name: context.application.name + '.' + context.application.function,
            timestamp: new Date().toISOString(),
        });
        this.context = Object.assign(this.context, context);
        this.context.correlation_id = xCorrelation || (0, uuid_1.v4)();
        this.context.trace = trace;
        if (!this.context.trace)
            this.context.trace = [];
    }
    buildLog(message, logType, extraContext = {}) {
        return {
            logType: logType,
            ...this.context,
            ...extraContext,
            message,
        };
    }
    info(message, extraContext) {
        this.pinoLogger.info(this.buildLog(message, 'application', extraContext));
    }
    log(message, ...optionalParams) {
        throw new Error('Method not implemented.');
    }
    error(message, error, extraContext) {
        this.pinoLogger.error(this.buildLog(message, 'application', {
            ...extraContext, error: JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)))
        }));
    }
    warn(message, ...optionalParams) {
        throw new Error('Method not implemented.');
    }
    businessError(message, extraContext) {
        this.pinoLogger.error(this.buildLog(message, 'business', extraContext));
    }
};
exports.LoggerContextService = LoggerContextService;
exports.LoggerContextService = LoggerContextService = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [])
], LoggerContextService);
//# sourceMappingURL=logger.service.js.map