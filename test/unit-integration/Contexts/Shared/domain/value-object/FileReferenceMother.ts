import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { WordMother } from './WordMother.js';

export class FileReferenceMother {
  static create(value: string): FileReference {
    return new FileReference(value);
  }

  static random(): FileReference {
    return this.create(WordMother.random());
  }
}
