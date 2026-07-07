export abstract class EnvironmentArranger {
  public abstract arrange(): Promise<void>;
  public abstract clean(): Promise<void>;
  public abstract close(): Promise<void>;
}
