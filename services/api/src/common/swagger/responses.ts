import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { applyDecorators, Type } from '@nestjs/common';

// Generic response wrappers for Swagger only
class ApiResponseWrapper<T> {
  data!: T;
  error?: { code: string; message: string };
}

class PaginatedMeta {
  nextCursor?: string | null;
}

class PaginatedWrapper<T> {
  items!: T[];
  meta!: PaginatedMeta;
  error?: { code: string; message: string };
}

export const ApiOkResponseData = <TModel extends Type<any>>(model?: TModel) => {
  return applyDecorators(
    ...(model ? [ApiExtraModels(ApiResponseWrapper, model)] : [ApiExtraModels(ApiResponseWrapper)]),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiResponseWrapper) },
          {
            properties: {
              data: model ? { $ref: getSchemaPath(model) } : { type: 'object', additionalProperties: true },
            },
          },
        ],
      },
    }),
  );
};

export const ApiOkResponsePaginated = <TModel extends Type<any>>(model?: TModel) => {
  return applyDecorators(
    ...(model ? [ApiExtraModels(PaginatedWrapper, model)] : [ApiExtraModels(PaginatedWrapper)]),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PaginatedWrapper) },
          {
            properties: {
              items: model
                ? { type: 'array', items: { $ref: getSchemaPath(model) } }
                : { type: 'array', items: { type: 'object', additionalProperties: true } },
              meta: { properties: { nextCursor: { type: 'string', nullable: true } } },
            },
          },
        ],
      },
    }),
  );
};
