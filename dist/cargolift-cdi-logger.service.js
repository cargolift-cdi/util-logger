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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoliftCDILogger = void 0;
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
// Scope.TRANSIENT significa que uma nova instância será criada
// toda vez que este serviço for injetado.
let CargoliftCDILogger = class CargoliftCDILogger {
    constructor(logger) {
        this.logger = logger;
    }
    // Define o contexto para esta instância específica do logger
    setContext(context) {
        const requiredFields = ['correlationId', 'application', 'consumer'];
        for (const field of requiredFields) {
            if (!context[field]) {
                throw new Error(`O campo obrigatório '${field}' não foi informado em setContext.`);
            }
        }
        this.context = context;
        // Também podemos definir o contexto no pino para que ele apareça no prefixo
        this.logger.setContext(context.name);
    }
    info(message, data, ...args) {
        this.logger.info(Object.assign(Object.assign({}, this.context), { data }), message, ...args);
    }
    error(error, message, ...args) {
        this.logger.error(Object.assign(Object.assign({}, this.context), { err: error }), message || error.message, ...args);
    }
    warn(message, ...args) {
        this.logger.warn(Object.assign({}, this.context), message, ...args);
    }
    debug(message, ...args) {
        this.logger.debug(Object.assign({}, this.context), message, ...args);
    }
    // Erro de negócio
    businessError(message, details) {
        this.logger.warn(Object.assign(Object.assign(Object.assign({}, this.context), { errorType: 'business' }), details), message);
    }
    criticalError(message, details) {
        this.logger.error(Object.assign(Object.assign(Object.assign({}, this.context), { errorType: 'critical' }), details), message);
    }
};
exports.CargoliftCDILogger = CargoliftCDILogger;
exports.CargoliftCDILogger = CargoliftCDILogger = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.TRANSIENT }),
    __metadata("design:paramtypes", [nestjs_pino_1.PinoLogger])
], CargoliftCDILogger);
