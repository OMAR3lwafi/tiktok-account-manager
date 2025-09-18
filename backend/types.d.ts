// Global type definitions for Encore.ts backend

declare global {
  namespace NodeJS {
    interface Global {
      Buffer: typeof Buffer;
    }
  }
}

export {};