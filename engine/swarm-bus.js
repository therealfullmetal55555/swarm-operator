/**
 * SWARM-OPERATOR // Event-Driven Agent Bus
 * Core coordination engine for multi-agent autonomous swarms.
 * Manages event routing, shared memory context, token telemetry, and execution traces.
 */

class SwarmEventBus {
  constructor() {
    this.listeners = new Map();
    this.memory = [];
    this.telemetry = {
      totalTokens: 0,
      estimatedCost: 0,
      startTime: null,
      elapsedMs: 0,
      messageCount: 0,
      toolCallsCount: 0
    };
    this.activeAgents = new Set();
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
    return () => this.off(event, handler);
  }

  off(event, handler) {
    if (!this.listeners.has(event)) return;
    const filtered = this.listeners.get(event).filter(h => h !== handler);
    this.listeners.set(event, filtered);
  }

  emit(event, data) {
    const timestamp = new Date().toISOString().substring(11, 19);
    const frame = {
      event,
      timestamp,
      data,
      id: 'evt_' + Math.random().toString(36).substring(2, 9)
    };

    // Record to shared episodic memory
    this.memory.push(frame);

    // Track tokens & telemetry
    if (data.tokens) {
      this.telemetry.totalTokens += data.tokens;
      // standard blended token cost estimate ($0.0005 per 1k tokens)
      this.telemetry.estimatedCost = (this.telemetry.totalTokens / 1000) * 0.0006;
    }
    this.telemetry.messageCount++;
    if (event === 'TOOL_INVOKED') this.telemetry.toolCallsCount++;

    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(handler => {
        try {
          handler(frame);
        } catch (err) {
          console.error(`Error in handler for event ${event}:`, err);
        }
      });
    }

    // Wildcard listeners
    if (this.listeners.has('*')) {
      this.listeners.get('*').forEach(h => h(frame));
    }
  }

  startMission() {
    this.telemetry.startTime = Date.now();
    this.telemetry.totalTokens = 0;
    this.telemetry.estimatedCost = 0;
    this.telemetry.messageCount = 0;
    this.telemetry.toolCallsCount = 0;
    this.memory = [];
  }

  getElapsed() {
    if (!this.telemetry.startTime) return 0;
    return Date.now() - this.telemetry.startTime;
  }

  reset() {
    this.memory = [];
    this.activeAgents.clear();
    this.telemetry.startTime = null;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SwarmEventBus };
}
