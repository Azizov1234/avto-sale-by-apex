import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type ExceptionResponsePayload = {
  statusCode: number;
  code: string;
  message: string;
  details?: string[];
};

type PrismaLikeError = {
  code?: string;
  meta?: {
    target?: string[] | string;
  };
};

const STATUS_CODE_TO_CODE: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
};

const STATUS_CODE_TO_MESSAGE: Record<number, string> = {
  400: "So'rovda xatolik bor. Ma'lumotlarni tekshirib qayta urinib ko'ring.",
  401: "Tizimga kirish talab qilinadi.",
  403: "Bu amalni bajarishga sizda ruxsat yo'q.",
  404: "So'ralgan ma'lumot topilmadi.",
  405: "Bu HTTP metod ushbu endpoint uchun qo'llab-quvvatlanmaydi.",
  409: "Bu ma'lumot allaqachon mavjud yoki ziddiyat bor.",
  413: "Yuborilgan ma'lumot hajmi juda katta.",
  415: "Yuborilgan fayl yoki kontent turi qo'llab-quvvatlanmaydi.",
  422: "Yuborilgan ma'lumotlar noto'g'ri formatda.",
  429: "Juda ko'p so'rov yuborildi. Birozdan keyin urinib ko'ring.",
  500: "Serverda xatolik yuz berdi. Birozdan keyin yana urinib ko'ring.",
};

const GENERIC_MESSAGES = new Set([
  'bad request',
  'bad request exception',
  'unauthorized',
  'forbidden',
  'not found',
  'conflict',
  'internal server error',
  'unprocessable entity',
  'validation failed',
]);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const normalized = this.normalizeException(exception);

    if (normalized.statusCode >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled exception at ${request.method} ${request.originalUrl ?? request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(normalized.statusCode).json({
      success: false,
      statusCode: normalized.statusCode,
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details?.length ? { details: normalized.details } : {}),
      path: request.originalUrl ?? request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private normalizeException(exception: unknown): ExceptionResponsePayload {
    if (exception instanceof HttpException) {
      return this.normalizeHttpException(exception);
    }

    const prismaError = this.normalizePrismaException(exception);
    if (prismaError) {
      return prismaError;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      code: STATUS_CODE_TO_CODE[HttpStatus.INTERNAL_SERVER_ERROR],
      message:
        STATUS_CODE_TO_MESSAGE[HttpStatus.INTERNAL_SERVER_ERROR] ??
        'Internal server error',
    };
  }

  private normalizeHttpException(exception: HttpException): ExceptionResponsePayload {
    const statusCode = exception.getStatus();
    const baseCode = this.statusCodeToCode(statusCode);
    const baseMessage = this.statusCodeToMessage(statusCode);

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        statusCode,
        code: baseCode,
        message: this.isGenericMessage(response) ? baseMessage : response,
      };
    }

    if (response && typeof response === 'object') {
      const data = response as Record<string, unknown>;
      const details = this.extractDetails(data);
      const message = this.extractMessage(data, baseMessage);
      const responseCode =
        typeof data.code === 'string'
          ? this.toErrorCode(data.code)
          : typeof data.error === 'string'
            ? this.toErrorCode(data.error)
            : baseCode;

      return {
        statusCode,
        code: responseCode,
        message,
        ...(details?.length ? { details } : {}),
      };
    }

    return {
      statusCode,
      code: baseCode,
      message: baseMessage,
    };
  }

  private normalizePrismaException(
    exception: unknown,
  ): ExceptionResponsePayload | null {
    if (!this.isPrismaLikeError(exception)) {
      return null;
    }

    const prismaError = exception as PrismaLikeError;
    const prismaCode = prismaError.code;

    if (prismaCode === 'P2002') {
      const targets = this.extractPrismaTargets(prismaError.meta?.target);
      const duplicateFieldPart =
        targets.length > 0 ? `: ${targets.join(', ')}` : '';

      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'CONFLICT',
        message: `Bu ma'lumot allaqachon mavjud${duplicateFieldPart}.`,
      };
    }

    if (prismaCode === 'P2025') {
      return {
        statusCode: HttpStatus.NOT_FOUND,
        code: 'NOT_FOUND',
        message: "So'ralgan ma'lumot topilmadi.",
      };
    }

    if (prismaCode === 'P2003') {
      return {
        statusCode: HttpStatus.CONFLICT,
        code: 'FOREIGN_KEY_CONSTRAINT',
        message:
          "Bog'liq ma'lumot topilmadi yoki bu amal bog'liqlik qoidalariga zid.",
      };
    }

    return null;
  }

  private extractMessage(payload: Record<string, unknown>, fallback: string) {
    const rawMessage = payload.message;

    if (typeof rawMessage === 'string') {
      return this.isGenericMessage(rawMessage) ? fallback : rawMessage;
    }

    if (Array.isArray(rawMessage) && rawMessage.length > 0) {
      const first = String(rawMessage[0]);
      return this.isGenericMessage(first) ? fallback : first;
    }

    if (typeof payload.error === 'string') {
      return this.isGenericMessage(payload.error) ? fallback : payload.error;
    }

    return fallback;
  }

  private extractDetails(payload: Record<string, unknown>) {
    const details = payload.details;
    if (Array.isArray(details)) {
      return details.map((item) => String(item));
    }

    const message = payload.message;
    if (Array.isArray(message)) {
      return message.map((item) => String(item));
    }

    return undefined;
  }

  private isPrismaLikeError(exception: unknown): exception is PrismaLikeError {
    return Boolean(
      exception &&
        typeof exception === 'object' &&
        'code' in exception &&
        typeof (exception as { code?: unknown }).code === 'string',
    );
  }

  private extractPrismaTargets(target: string[] | string | undefined) {
    if (!target) {
      return [];
    }

    return Array.isArray(target) ? target : [target];
  }

  private statusCodeToCode(statusCode: number) {
    return STATUS_CODE_TO_CODE[statusCode] ?? 'HTTP_ERROR';
  }

  private statusCodeToMessage(statusCode: number) {
    return (
      STATUS_CODE_TO_MESSAGE[statusCode] ??
      STATUS_CODE_TO_MESSAGE[HttpStatus.INTERNAL_SERVER_ERROR]
    );
  }

  private toErrorCode(value: string) {
    const normalized = value
      .trim()
      .replace(/[^\w]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .toUpperCase();

    return normalized || 'HTTP_ERROR';
  }

  private isGenericMessage(message: string) {
    return GENERIC_MESSAGES.has(message.trim().toLowerCase());
  }
}
