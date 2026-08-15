/**
 * Performance Monitoring Utilities for EPIONARA.
 * Uses performance.now() to measure high-resolution durations.
 */

const LOAD_METRICS_KEY = "sj_perf_load_times";
const AI_METRICS_KEY = "sj_perf_ai_calls";

/**
 * Tracks the load time of a page component.
 * @param {string} pageName - The name of the loaded page.
 * @param {number} startTime - The performance.now() timestamp when loading began.
 */
export function trackPageLoad(pageName, startTime) {
  try {
    const duration = performance.now() - startTime;
    const raw = localStorage.getItem(LOAD_METRICS_KEY);
    const metrics = raw ? JSON.parse(raw) : {};
    if (!metrics[pageName]) {
      metrics[pageName] = [];
    }
    metrics[pageName].push({ duration, ts: Date.now() });
    
    // Keep last 30 entries to prevent local storage inflation
    if (metrics[pageName].length > 30) {
      metrics[pageName] = metrics[pageName].slice(-30);
    }
    localStorage.setItem(LOAD_METRICS_KEY, JSON.stringify(metrics));
  } catch (e) {
    console.error("[Performance] Error tracking page load:", e);
  }
}

/**
 * Tracks duration and success status of Gemini API requests.
 * @param {number} duration - Time spent in milliseconds.
 * @param {boolean} success - Whether the call completed successfully.
 */
export function trackAICall(duration, success) {
  try {
    const raw = localStorage.getItem(AI_METRICS_KEY);
    const calls = raw ? JSON.parse(raw) : [];
    calls.push({ duration, success, ts: Date.now() });
    
    // Keep last 50 calls
    if (calls.length > 50) {
      localStorage.setItem(AI_METRICS_KEY, JSON.stringify(calls.slice(-50)));
    } else {
      localStorage.setItem(AI_METRICS_KEY, JSON.stringify(calls));
    }
  } catch (e) {
    console.error("[Performance] Error tracking AI call:", e);
  }
}

/**
 * Generates an aggregated report of system load times and AI metrics.
 * @returns {{
 *   avgPageLoads: Object<string, string>,
 *   avgAICallTime: string,
 *   aiSuccessRate: string,
 *   totalAICalls: number
 * }} Telemetry statistics report.
 */
export function getPerformanceReport() {
  try {
    const rawLoads = localStorage.getItem(LOAD_METRICS_KEY);
    const loads = rawLoads ? JSON.parse(rawLoads) : {};
    const avgPageLoads = {};
    Object.entries(loads).forEach(([page, list]) => {
      if (list && list.length) {
        const sum = list.reduce((acc, curr) => acc + curr.duration, 0);
        avgPageLoads[page] = (sum / list.length).toFixed(1) + "ms";
      }
    });

    const rawCalls = localStorage.getItem(AI_METRICS_KEY);
    const calls = rawCalls ? JSON.parse(rawCalls) : [];
    let avgAICallTime = "-";
    let aiSuccessRate = "-";
    if (calls.length) {
      const sum = calls.reduce((acc, curr) => acc + curr.duration, 0);
      avgAICallTime = (sum / calls.length).toFixed(1) + "ms";
      const successes = calls.filter((c) => c.success).length;
      aiSuccessRate = ((successes / calls.length) * 100).toFixed(0) + "%";
    }

    return {
      avgPageLoads,
      avgAICallTime,
      aiSuccessRate,
      totalAICalls: calls.length,
    };
  } catch (e) {
    console.error("[Performance] Error generating report:", e);
    return {
      avgPageLoads: {},
      avgAICallTime: "-",
      aiSuccessRate: "-",
      totalAICalls: 0,
    };
  }
}
