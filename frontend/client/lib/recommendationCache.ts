/**
 * Recommendation cache utility for localStorage
 * Caches recommendations with timestamps to improve page reload performance
 */

import type { Location } from "../../shared/api";

interface CachedRecommendations {
  recommendations: Location[];
  timestamp: number;
  userId: string;
}

const CACHE_KEY_PREFIX = 'justdoeit_recommendations_';
const CACHE_EXPIRY_MINUTES = 30; // Same as backend cache

export class RecommendationCache {
  private static getCacheKey(userId: string): string {
    return `${CACHE_KEY_PREFIX}${userId}`;
  }

  private static isCacheValid(timestamp: number): boolean {
    const now = Date.now();
    const expiryTime = timestamp + (CACHE_EXPIRY_MINUTES * 60 * 1000);
    return now < expiryTime;
  }

  /**
   * Get cached recommendations for a user
   */
  static get(userId: string): Location[] | null {
    try {
      const cacheKey = this.getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsed: CachedRecommendations = JSON.parse(cached);
      
      // Check if cache is still valid
      if (!this.isCacheValid(parsed.timestamp)) {
        this.clear(userId);
        return null;
      }

      // Verify this cache is for the correct user
      if (parsed.userId !== userId) {
        this.clear(userId);
        return null;
      }

      return parsed.recommendations;
    } catch (error) {
      console.error('Error reading recommendation cache:', error);
      this.clear(userId);
      return null;
    }
  }

  /**
   * Cache recommendations for a user
   */
  static set(userId: string, recommendations: Location[]): void {
    try {
      const cacheKey = this.getCacheKey(userId);
      const cacheData: CachedRecommendations = {
        recommendations,
        timestamp: Date.now(),
        userId
      };
      
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      console.log(`Cached ${recommendations.length} recommendations for user ${userId}`);
    } catch (error) {
      console.error('Error caching recommendations:', error);
    }
  }

  /**
   * Clear cached recommendations for a user
   */
  static clear(userId: string): void {
    try {
      const cacheKey = this.getCacheKey(userId);
      localStorage.removeItem(cacheKey);
      console.log(`Cleared recommendation cache for user ${userId}`);
    } catch (error) {
      console.error('Error clearing recommendation cache:', error);
    }
  }

  /**
   * Clear all recommendation caches
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(CACHE_KEY_PREFIX));
      
      cacheKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`Cleared ${cacheKeys.length} recommendation caches`);
    } catch (error) {
      console.error('Error clearing all recommendation caches:', error);
    }
  }

  /**
   * Check if cache exists and is valid for a user
   */
  static hasValidCache(userId: string): boolean {
    return this.get(userId) !== null;
  }

  /**
   * Get cache age in minutes
   */
  static getCacheAge(userId: string): number | null {
    try {
      const cacheKey = this.getCacheKey(userId);
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) {
        return null;
      }

      const parsed: CachedRecommendations = JSON.parse(cached);
      const ageMs = Date.now() - parsed.timestamp;
      return Math.floor(ageMs / (60 * 1000));
    } catch (error) {
      return null;
    }
  }
}
