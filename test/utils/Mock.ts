import { vi, expect, Mock as VitestMock } from 'vitest';

export class Mock {
  private calledMethod: VitestMock = vi.fn();
  private calledWith: unknown[] = [];
  private calledTimes: number = 0;
  private returnValue: unknown = null;

  shouldReceive(method: VitestMock): Mock {
    this.calledMethod = method;
    return this;
  }
  withNoArgs(): Mock {
    this.calledWith = [];
    return this;
  }
  withArgs(...args: unknown[]): Mock {
    this.calledWith = args;
    return this;
  }
  once(): Mock {
    this.calledTimes = 1;
    return this;
  }
  times(times: number): Mock {
    this.calledTimes = times;
    return this;
  }
  andReturnNull(): Mock {
    this.returnValue = null;
    this.returnValueFromCalledMethod();
    return this;
  }
  andReturn(value: unknown): Mock {
    this.returnValue = value;
    this.returnValueFromCalledMethod();
    return this;
  }
  andReject(value: unknown): Mock {
    this.calledMethod.mockRejectedValue(value);
    return this;
  }
  private returnValueFromCalledMethod() {
    this.calledMethod.mockResolvedValue(this.returnValue);
  }
  expect(expected: unknown) {
    expect(this.calledMethod).toHaveBeenCalled();
    expect(this.calledMethod).toHaveBeenCalledWith(...this.calledWith);
    expect(this.calledMethod).toHaveBeenCalledTimes(this.calledTimes);
    expect(this.returnValue).toBe(expected);
  }
}
