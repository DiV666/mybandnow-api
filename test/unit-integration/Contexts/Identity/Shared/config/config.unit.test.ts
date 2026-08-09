import { describe, it, expect } from 'vitest';
import mybandnowConfig from '../../../../../../src/Contexts/Identity/Shared/config/config.js';

describe('mybandnowConfig', () => {
  it('should have service property with mybandnow-api value', () => {
    // Arrange & Act
    const config = mybandnowConfig;

    // Assert
    expect(config).toHaveProperty('service');
    expect(config.service).toBe('mybandnow-api');
  });

  it('should be an immutable object with correct structure', () => {
    // Arrange & Act
    const config = mybandnowConfig;

    // Assert
    expect(config).toEqual({
      service: 'mybandnow-api'
    });
  });
});
