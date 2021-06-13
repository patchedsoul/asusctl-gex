export interface IStoppableModule {
    isRunning(): boolean;
    start(): void;
    stop(): void;
}
