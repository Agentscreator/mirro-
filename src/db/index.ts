// src/db/index.ts
import 'dotenv/config'; // This line MUST come first
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon with available options
const sql = neon(process.env.DATABASE_URL!, {
  fullResults: true, // Get full result metadata
});

export const db = drizzle(sql, {
  logger: process.env.NODE_ENV === 'development', // Enable logging in dev
});

// Utility function for retrying operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  delay: number = 500
): Promise<T> {
  let lastError: Error;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.log(`🔄 Retry ${i + 1}/${maxRetries} failed:`, lastError.message);
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError!;
}