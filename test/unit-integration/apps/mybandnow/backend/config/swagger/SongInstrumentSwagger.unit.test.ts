import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

interface OpenApiParameter {
  name: string;
}

interface OpenApiOperation {
  operationId?: string;
  parameters?: OpenApiParameter[];
  requestBody?: {
    content?: {
      'application/json'?: {
        schema?: {
          $ref?: string;
        };
      };
    };
  };
}

interface OpenApiDefinition {
  paths: Record<string, Record<string, OpenApiOperation>>;
}

describe('Song instrument OpenAPI contract', () => {
  const definition = readDefinition();

  it('uses the edit operation on the song instrument patch endpoint', () => {
    // Arrange
    const operation = definition.paths['/v1/songs/{songId}/instruments/{songInstrumentId}']?.patch;

    // Assert
    expect(operation?.operationId).toBe('songInstrumentPatchEdit');
    expect(operation?.parameters?.map((parameter) => parameter.name)).toContain('songInstrumentId');
    expect(operation?.requestBody?.content?.['application/json']?.schema?.$ref).toBe(
      '#/components/schemas/SongInstrumentEditRequest'
    );
  });

  it('uses the musician-assign operation on the explicit musician assign endpoint', () => {
    // Arrange
    const operation = definition.paths['/v1/songs/{songId}/instruments/{songInstrumentId}/musician-assign']?.patch;

    // Assert
    expect(operation?.operationId).toBe('songInstrumentPatchMusicianAssign');
    expect(operation?.parameters?.map((parameter) => parameter.name)).toContain('songInstrumentId');
    expect(operation?.requestBody?.content?.['application/json']?.schema?.$ref).toBe(
      '#/components/schemas/SongInstrumentAssignRequest'
    );
  });
});

function readDefinition(): OpenApiDefinition {
  try {
    return JSON.parse(
      readFileSync('src/apps/mybandnow/backend/config/swagger/definition.json', 'utf8')
    ) as OpenApiDefinition;
  } catch (error) {
    throw new Error(`Failed to read OpenAPI definition: ${String(error)}`);
  }
}
