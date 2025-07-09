'use client';

/**
 * @fileOverview Cryptographic utilities for client-side operations.
 */

/**
 * Hashes a string using the SHA-256 algorithm.
 * Uses the Web Crypto API, which is available in modern browsers.
 * @param text The string to hash.
 * @returns A promise that resolves to the hex-encoded SHA-256 hash.
 */
export async function hashText(text: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // This should not happen in a browser environment, but it's a good safeguard.
    // A server-side fallback would be needed for SSR password operations, but for this client-side
    // feature, we assume a browser context.
    throw new Error('Web Crypto API is not available.');
  }

  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}
