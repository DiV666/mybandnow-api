import { describe, it, expect, vi } from 'vitest';
import { InMemoryCommandBus } from '../../../../../../src/Contexts/Shared/infrastructure/CommandBus/InMemoryCommandBus.js';
import { CommandHandlersInformation } from '../../../../../../src/Contexts/Shared/infrastructure/CommandBus/CommandHandlersInformation.js';
import { Command } from '../../../../../../src/Contexts/Shared/domain/Command.js';
import { CommandHandler } from '../../../../../../src/Contexts/Shared/domain/CommandHandler.js';
import { CommandNotRegisteredError } from '../../../../../../src/Contexts/Shared/domain/CommandNotRegisteredError.js';

// Concrete command for testing
class TestCommand extends Command {
  constructor(readonly value: string) {
    super();
  }
}

// Concrete handler for testing
class TestCommandHandler implements CommandHandler<TestCommand> {
  public handled: TestCommand | null = null;

  subscribedTo(): typeof TestCommand {
    return TestCommand;
  }

  async handle(command: TestCommand): Promise<void> {
    this.handled = command;
  }
}

describe('CommandHandlersInformation', () => {
  it('finds the registered handler for a command', () => {
    // Arrange
    const handler = new TestCommandHandler();
    const info = new CommandHandlersInformation([handler]);
    const command = new TestCommand('data');

    // Act
    const found = info.search(command);

    // Assert
    expect(found).toBe(handler);
  });

  it('throws CommandNotRegisteredError when no handler is registered', () => {
    // Arrange
    const info = new CommandHandlersInformation([]);
    const command = new TestCommand('data');

    // Act & Assert
    expect(() => info.search(command)).toThrow(CommandNotRegisteredError);
  });

  it('throws with the command class name in the error message', () => {
    const info = new CommandHandlersInformation([]);
    const command = new TestCommand('data');
    expect(() => info.search(command)).toThrow('TestCommand');
  });
});

describe('InMemoryCommandBus', () => {
  it('dispatches a command to the registered handler', async () => {
    // Arrange
    const handler = new TestCommandHandler();
    const info = new CommandHandlersInformation([handler]);
    const bus = new InMemoryCommandBus(info);
    const command = new TestCommand('hello');

    // Act
    await bus.dispatch(command);

    // Assert
    expect(handler.handled).toBe(command);
  });

  it('propagates errors thrown by the handler', async () => {
    // Arrange
    const handler = new TestCommandHandler();
    handler.handle = vi.fn().mockRejectedValue(new Error('handler failed'));
    const info = new CommandHandlersInformation([handler]);
    const bus = new InMemoryCommandBus(info);

    // Act & Assert
    await expect(bus.dispatch(new TestCommand('x'))).rejects.toThrow('handler failed');
  });

  it('throws CommandNotRegisteredError for unregistered command', async () => {
    const info = new CommandHandlersInformation([]);
    const bus = new InMemoryCommandBus(info);
    await expect(bus.dispatch(new TestCommand('x'))).rejects.toThrow(CommandNotRegisteredError);
  });
});
