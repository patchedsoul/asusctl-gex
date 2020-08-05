export interface IDestroyableModule {
    create(): void;
    destroy(): void;
}
