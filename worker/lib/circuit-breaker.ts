import CircuitBreaker from "opossum";

interface CircuitBreakerOptions {
  timeout?: number;
  errorThresholdPercentage?: number;
  resetTimeout?: number;
}

export function createCircuitBreaker<T>(
  fn: (...args: unknown[]) => Promise<T>,
  name: string,
  options: CircuitBreakerOptions = {},
): CircuitBreaker<unknown[], T> {
  const cb = new CircuitBreaker(fn, {
    timeout: options.timeout ?? 10000,
    errorThresholdPercentage: options.errorThresholdPercentage ?? 50,
    resetTimeout: options.resetTimeout ?? 30000,
    name,
  });
  cb.on("open", () => console.warn(`[circuit-breaker] OPEN: ${name}`));
  cb.on("halfOpen", () => console.info(`[circuit-breaker] HALF-OPEN: ${name}`));
  return cb;
}
