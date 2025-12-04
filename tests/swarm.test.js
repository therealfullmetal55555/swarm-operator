/**
 * SWARM-OPERATOR // Verification Test Suite
 * Tests EventBus, Agent coordination, Mission execution loop, and telemetry.
 */

const { SwarmEventBus } = require('../engine/swarm-bus.js');
const { AGENT_PERSONAS, MISSION_PRESETS, SwarmMissionController } = require('../engine/agents.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✔ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✘ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log(' SWARM-OPERATOR // VERIFICATION SUITE');
  console.log('====================================================\n');

  // Test 1: Personas validation
  assert(Object.keys(AGENT_PERSONAS).length === 4, '4 core agent personas registered (orchestrator, scout, executor, auditor)');
  assert(AGENT_PERSONAS.orchestrator.code === 'ORC-01', 'Orchestrator has designated system code ORC-01');

  // Test 2: Presets validation
  assert(MISSION_PRESETS.length >= 3, 'Pre-configured mission presets available (ecom, incident, analytics)');
  const firstPreset = MISSION_PRESETS[0];
  assert(firstPreset.decomposition.length === 5, 'E-commerce mission contains 5-step DAG decomposition');

  // Test 3: Event Bus routing
  const bus = new SwarmEventBus();
  let receivedEvt = null;
  const unsubscribe = bus.on('AGENT_ACTION', (frame) => {
    receivedEvt = frame;
  });

  bus.emit('AGENT_ACTION', { agent: 'orchestrator', action: 'Plan DAG', tokens: 150 });
  assert(receivedEvt !== null && receivedEvt.event === 'AGENT_ACTION', 'EventBus receives and dispatches AGENT_ACTION');
  assert(receivedEvt.data.tokens === 150, 'EventBus preserves event data payload');
  assert(bus.telemetry.totalTokens === 150, 'EventBus tracks cumulative token usage');
  assert(bus.telemetry.estimatedCost > 0, 'EventBus computes accurate blended token cost');

  // Test 4: Unsubscribe
  unsubscribe();
  receivedEvt = null;
  bus.emit('AGENT_ACTION', { agent: 'scout', action: 'Search', tokens: 50 });
  assert(receivedEvt === null, 'EventBus unsubscribe halts listener notifications');

  // Test 5: Wildcard listener
  let wildcardCount = 0;
  bus.on('*', () => { wildcardCount++; });
  bus.emit('TOOL_INVOKED', { tool: 'web_search' });
  bus.emit('STEP_COMPLETED', { step: 1 });
  assert(wildcardCount === 2, 'Wildcard (*) listener receives all dispatched events');
  assert(bus.telemetry.toolCallsCount === 1, 'Tool invocation counter accurately updated');

  // Test 6: Mission Controller execution
  const controller = new SwarmMissionController(bus);
  let completedEventReceived = false;
  bus.on('MISSION_COMPLETE', (data) => {
    completedEventReceived = true;
  });

  assert(!controller.isRunning, 'Controller starts in idle state');

  const fastMission = {
    id: 'test_quick_mission',
    label: 'Unit Test Quick Dispatch',
    decomposition: [
      { step: 1, agent: 'orchestrator', action: 'Verify graph connectivity' },
      { step: 2, agent: 'auditor', action: 'Validate payload integrity' }
    ]
  };

  const missionPromise = controller.runMission(fastMission, null, 10); // fast 10ms delay
  assert(controller.isRunning, 'Controller transitions to isRunning during active mission');

  const report = await missionPromise;
  assert(!controller.isRunning, 'Controller returns to idle state upon mission completion');
  assert(report && report.markdown.includes('MISSION DIRECTIVE REPORT'), 'Generates formatted markdown mission report');
  assert(report && report.rawJson.verified === true, 'Report verifies payload and marks mission verified');
  assert(completedEventReceived, 'Status listener received MISSION_COMPLETE notification');

  // Test 7: Reset functionality
  bus.reset();
  assert(bus.memory.length === 0, 'EventBus reset clears memory history');

  console.log('\n----------------------------------------------------');
  console.log(` RESULTS: ${passed} passed, ${failed} failed (Total: ${passed + failed})`);
  console.log('----------------------------------------------------\n');

  if (failed > 0) process.exit(1);
}

runTests();
