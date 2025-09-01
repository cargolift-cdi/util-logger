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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CdiLoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CdiLoggerService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
let CdiLoggerService = CdiLoggerService_1 = class CdiLoggerService {
    constructor(pinoLogger) {
        this.pinoLogger = pinoLogger;
        this.context = {};
        this.traceHistory = [];
    }
    setContext(context) {
        if (!context.correlationId ||
            !context.application?.module ||
            !context.application?.function ||
            !context.application?.action ||
            !context.caller?.type ||
            !context.caller?.id ||
            !context.trace) {
            throw new Error('CdiLoggerService Error: Contexto de log inválido. Campos obrigatórios ausentes.');
        }
        this.context = context;
        this.pinoLogger.setContext(CdiLoggerService_1.name);
        this.traceHistory = [context.trace];
        this.updateTraceString();
    }
    addTraceStep(name) {
        if (!this.context.correlationId) {
            return;
        }
        const newTrace = {
            name,
            timestamp: new Date().toISOString(),
        };
        this.traceHistory.push(newTrace);
        this.updateTraceString();
    }
    updateTraceString() {
        this.context.trace_string = this.traceHistory.map(t => t.name).join(' -> ');
    }
    mergePayload(message, payload = {}, errorType = 'none') {
        const latestTrace = this.traceHistory[this.traceHistory.length - 1];
        const finalPayload = {
            ...this.context,
            trace: latestTrace,
            full_trace_history: this.traceHistory,
            errorType,
            ...payload,
        };
        return { payload: finalPayload, message };
    }
    log(message, payload) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.info(finalPayload, msg);
    }
    info(message, payload) {
        this.log(message, payload);
    }
    error(message, traceOrPayload, errorType = 'application') {
        let payload = {};
        if (typeof traceOrPayload === 'object') {
            payload = traceOrPayload;
        }
        else if (typeof traceOrPayload === 'string') {
            payload = { stack: traceOrPayload };
        }
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload, errorType);
        this.pinoLogger.error(finalPayload, msg);
    }
    warn(message, payload) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.warn(finalPayload, msg);
    }
    debug(message, payload) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.debug(finalPayload, msg);
    }
    verbose(message, payload) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.trace(finalPayload, msg);
    }
};
exports.CdiLoggerService = CdiLoggerService;
exports.CdiLoggerService = CdiLoggerService = CdiLoggerService_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __param(0, (0, common_1.Inject)(nestjs_pino_1.PinoLogger)),
    __metadata("design:paramtypes", [nestjs_pino_1.PinoLogger])
], CdiLoggerService);
//# sourceMappingURL=cdi-logger.service.js.map