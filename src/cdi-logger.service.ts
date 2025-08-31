// src/cdi-logger.service.ts

import { Injectable, Scope, Inject, LoggerService } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
    CdiLoggerContext,
    ErrorType,
    Trace,
} from './interfaces/cdi-logger.interfaces';

@Injectable({ scope: Scope.TRANSIENT }) // TRANSIENT para garantir uma instância por requisição
export class CdiLoggerService implements LoggerService {
    private context: Partial<CdiLoggerContext> = {};
    private traceHistory: Trace[] = [];

    // Injetamos o PinoLogger original
    constructor(@Inject(PinoLogger) private readonly pinoLogger: PinoLogger) { }

    /**
     * Define o contexto principal para todos os logs subsequentes.
     * Valida os campos obrigatórios.
     * @param context O contexto da requisição/operação.
     */
    setContext(context: CdiLoggerContext) {
        if (
            !context.correlationId ||
            !context.application?.module ||
            !context.application?.function ||
            !context.application?.action ||
            !context.caller?.type ||
            !context.caller?.id ||
            !context.trace
        ) {
            throw new Error(
                'CdiLoggerService Error: Contexto de log inválido. Campos obrigatórios ausentes.',
            );
        }

        this.context = context;
        // Seta o contexto no PinoLogger para que ele apareça em logs automáticos do NestJS
        this.pinoLogger.setContext(CdiLoggerService.name);

        // Inicia o histórico de trace
        this.traceHistory = [context.trace];
        this.updateTraceString();
    }

    /**
     * Adiciona um novo passo ao rastreamento (trace).
     * @param name Nome descritivo do passo.
     */
    addTraceStep(name: string) {
        if (!this.context.correlationId) {
            // Não faz nada se o contexto não foi iniciado
            return;
        }
        const newTrace: Trace = {
            name,
            timestamp: new Date().toISOString(),
        };
        this.traceHistory.push(newTrace);
        this.updateTraceString();
    }

    private updateTraceString() {
        this.context.trace_string = this.traceHistory.map(t => t.name).join(' -> ');
    }

    private mergePayload(
        message: string,
        payload: Record<string, any> = {},
        errorType: ErrorType = 'none',
    ) {
        // Garante que o trace mais recente e o histórico completo estejam no log
        const latestTrace = this.traceHistory[this.traceHistory.length - 1];

        const finalPayload = {
            ...this.context,
            trace: latestTrace, // Log contém o trace do passo atual
            full_trace_history: this.traceHistory, // Adiciona o histórico completo para análise
            errorType,
            ...payload,
        };

        // Remove o campo de mensagem do objeto para não duplicar
        // (Não é necessário, pois 'message' não existe em finalPayload)

        return { payload: finalPayload, message };
    }

    log(message: string, payload?: Record<string, any>) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.info(finalPayload, msg);
    }

    info(message: string, payload?: Record<string, any>) {
        this.log(message, payload);
    }

    error(message: string, traceOrPayload?: string | Record<string, any>, errorType: ErrorType = 'application') {
        let payload = {};
        if (typeof traceOrPayload === 'object') {
            payload = traceOrPayload;
        } else if (typeof traceOrPayload === 'string') {
            // Se for uma string (stack trace), adicionamos ao payload
            payload = { stack: traceOrPayload };
        }

        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload, errorType);
        this.pinoLogger.error(finalPayload, msg);
    }

    warn(message: string, payload?: Record<string, any>) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.warn(finalPayload, msg);
    }

    debug(message: string, payload?: Record<string, any>) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.debug(finalPayload, msg);
    }

    verbose(message: string, payload?: Record<string, any>) {
        const { payload: finalPayload, message: msg } = this.mergePayload(message, payload);
        this.pinoLogger.trace(finalPayload, msg);
    }
}