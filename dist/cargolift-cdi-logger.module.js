"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoliftCDILoggerModule = void 0;
// logging.module.ts
const common_1 = require("@nestjs/common");
const nestjs_pino_1 = require("nestjs-pino");
const cargolift_cdi_logger_service_1 = require("./cargolift-cdi-logger.service");
// Usamos @Global() para que o ContextualLogger fique disponível
// para injeção em toda a aplicação sem precisar importar o LoggingModule
// em todos os outros módulos. É opcional, mas conveniente para um logger.
let CargoliftCDILoggerModule = class CargoliftCDILoggerModule {
};
exports.CargoliftCDILoggerModule = CargoliftCDILoggerModule;
exports.CargoliftCDILoggerModule = CargoliftCDILoggerModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [
            nestjs_pino_1.LoggerModule.forRoot({
                pinoHttp: {
                    name: 'middleware-service-email',
                    // TODO: Produção
                    level: process.env.NODE_ENV !== 'production' ? 'debug' : 'info',
                    // level: 'info'
                    transport: process.env.NODE_ENV !== 'production'
                        ? {
                            target: 'pino-pretty',
                            options: {
                                singleLine: true,
                                colorize: true,
                                translateTime: 'SYS:dd/mm/yyyy HH:MM:ss',
                                ignore: 'pid,hostname',
                            },
                        }
                        : undefined,
                },
            }),
        ],
        providers: [cargolift_cdi_logger_service_1.CargoliftCDILogger], // Disponibiliza o ContextualLogger para injeção
        exports: [cargolift_cdi_logger_service_1.CargoliftCDILogger], // Exporta para que outros módulos possam usá-lo
    })
], CargoliftCDILoggerModule);
