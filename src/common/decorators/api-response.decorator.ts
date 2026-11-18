import { applyDecorators, HttpStatus, Type } from "@nestjs/common";
import { ApiExtraModels, ApiResponse, getSchemaPath } from "@nestjs/swagger";

interface ApiResponseWrapperOptions<T extends Type<unknown>> {
  dataDto?: T;
  isArray?: boolean;
  status?: HttpStatus;
  hasPagination?: boolean;
}

export function ApiResponseWrapper<T extends Type<unknown>>({
  dataDto,
  isArray = false,
  status = HttpStatus.OK,
  hasPagination = false,
}: ApiResponseWrapperOptions<T> = {}) {
  return applyDecorators(
    ...(dataDto ? [ApiExtraModels(dataDto)] : []),
    ApiResponse({
      status,
      schema: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          message: {
            type: "string",
            example: "Operation successful",
          },
          ...(dataDto && {
            data: isArray
              ? {
                  type: "array",
                  items: { $ref: getSchemaPath(dataDto) },
                }
              : {
                  $ref: getSchemaPath(dataDto),
                },
          }),
          ...(hasPagination && {
            meta: {
              type: "object",
              properties: {
                total: { type: "number", example: 100 },
                page: { type: "number", example: 1 },
                limit: { type: "number", example: 10 },
                totalPages: { type: "number", example: 10 },
              },
            },
          }),
        },
      },
    }),
  );
}
