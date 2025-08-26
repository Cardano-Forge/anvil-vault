export class VaultError extends Error {
  public readonly statusCode: number;

  constructor(input: { message: string; statusCode: number } & ErrorOptions) {
    const { message, statusCode, ...opts } = input;
    super(message, opts);
    this.name = "VaultError";
    this.statusCode = statusCode;
  }
}
