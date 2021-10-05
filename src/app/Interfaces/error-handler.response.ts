export interface ErrorHandlerResponse<T = any> {
    error: { message: string, status: number };
    data: T;
}
