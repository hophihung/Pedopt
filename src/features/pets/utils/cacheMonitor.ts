/**
 * Utility để monitor và log cache performance
 */

interface CacheMetrics {
  hits: number;
  misses: number;
  totalRequests: number;
  averageAge: number;
  lastUpdated: number;
}

class CacheMonitor {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    totalRequests: 0,
    averageAge: 0,
    lastUpdated: Date.now(),
  };

  recordCacheHit(ageMinutes: number) {
    this.metrics.hits++;
    this.metrics.totalRequests++;
    this.updateAverageAge(ageMinutes);
    this.logMetrics('HIT', ageMinutes);
  }

  recordCacheMiss() {
    this.metrics.misses++;
    this.metrics.totalRequests++;
    this.logMetrics('MISS');
  }

  private updateAverageAge(ageMinutes: number) {
    const totalAge = this.metrics.averageAge * (this.metrics.hits - 1) + ageMinutes;
    this.metrics.averageAge = totalAge / this.metrics.hits;
  }

  private logMetrics(type: 'HIT' | 'MISS', age?: number) {
    const hitRate = this.metrics.totalRequests > 0 
      ? ((this.metrics.hits / this.metrics.totalRequests) * 100).toFixed(1)
      : '0';

    const ageText = age !== undefined ? ` (age: ${age}min)` : '';
    
    console.log(
      `📊 Cache ${type}${ageText} | Hit Rate: ${hitRate}% | ` +
      `Hits: ${this.metrics.hits} | Misses: ${this.metrics.misses} | ` +
      `Avg Age: ${this.metrics.averageAge.toFixed(1)}min`
    );
  }

  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  getHitRate(): number {
    return this.metrics.totalRequests > 0 
      ? (this.metrics.hits / this.metrics.totalRequests) * 100 
      : 0;
  }

  reset() {
    this.metrics = {
      hits: 0,
      misses: 0,
      totalRequests: 0,
      averageAge: 0,
      lastUpdated: Date.now(),
    };
    console.log('📊 Cache metrics reset');
  }

  // Log summary mỗi 10 requests
  logSummaryIfNeeded() {
    if (this.metrics.totalRequests % 10 === 0 && this.metrics.totalRequests > 0) {
      const hitRate = this.getHitRate();
      console.log(
        `📊 Cache Summary (${this.metrics.totalRequests} requests): ` +
        `${hitRate.toFixed(1)}% hit rate, ` +
        `${this.metrics.averageAge.toFixed(1)}min avg age`
      );
    }
  }
}

// Singleton instance
export const cacheMonitor = new CacheMonitor();

// Helper functions
export const logCacheHit = (ageMinutes: number) => {
  cacheMonitor.recordCacheHit(ageMinutes);
  cacheMonitor.logSummaryIfNeeded();
};

export const logCacheMiss = () => {
  cacheMonitor.recordCacheMiss();
  cacheMonitor.logSummaryIfNeeded();
};

export const getCacheMetrics = () => cacheMonitor.getMetrics();
export const getCacheHitRate = () => cacheMonitor.getHitRate();
export const resetCacheMetrics = () => cacheMonitor.reset();