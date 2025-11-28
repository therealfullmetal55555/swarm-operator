/**
 * SWARM-OPERATOR // Autonomous Agent Personas & Execution Loop
 */

const AGENT_PERSONAS = {
  orchestrator: {
    id: 'agent_orchestrator',
    name: 'ORCHESTRATOR',
    code: 'ORC-01',
    role: 'Decomposition & Task Allocation',
    accent: '#5dff9e',
    model: 'claude-3-7-sonnet / reasoning-high',
    systemPrompt: 'Break down overarching business goals into strict DAG sub-routines with dependency resolution.'
  },
  scout: {
    id: 'agent_scout',
    name: 'INTEL SCOUT',
    code: 'SCT-02',
    role: 'Market & Technical Discovery',
    accent: '#78dce8',
    model: 'sonar-pro / live-search',
    systemPrompt: 'Extract factual market metrics, competitor parameters, API contracts, and constraint baselines.'
  },
  executor: {
    id: 'agent_executor',
    name: 'SYSTEM SYNTHESIZER',
    code: 'SYN-03',
    role: 'Code & Artifact Engineering',
    accent: '#ffb454',
    model: 'gpt-4o / fast-executor',
    systemPrompt: 'Synthesize deliverables: production JSON schemas, automated copywriting, scripts, and funnel pipelines.'
  },
  auditor: {
    id: 'agent_auditor',
    name: 'CRITIC AUDITOR',
    code: 'ADT-04',
    role: 'Constraint & SLA Verification',
    accent: '#ff6188',
    model: 'o3-mini / formal-verifier',
    systemPrompt: 'Enforce SLA compliance, check for edge-case vulnerabilities, and verify against business requirements.'
  }
};

const MISSION_PRESETS = [
  {
    id: 'ecom_funnel',
    label: '01 / E-Commerce Rich-Content & Funnel Launch',
    category: 'MARKETPLACE OPS',
    prompt: 'Launch product line on Wildberries & Ozon: construct 16 SKU Rich Content JSON, automate EAN-13 barcodes, and build closed-loop UTM social funnels.',
    decomposition: [
      { step: 1, agent: 'orchestrator', action: 'Parse SKU constraints, define FBO shipping requirements, map dependencies.' },
      { step: 2, agent: 'scout', action: 'Scan marketplace top seller cards in wellness/supplements, extract keyword cluster.' },
      { step: 3, agent: 'executor', action: 'Draft validated Ozon Rich-Content JSON blocks, generate EAN-13 algorithm, write copy.' },
      { step: 4, agent: 'auditor', action: 'Verify Russian Federal Law on dietary supplements (no medical promises), check JSON schema syntax.' },
      { step: 5, agent: 'orchestrator', action: 'Compile final deliverables into deployable artifacts package.' }
    ]
  },
  {
    id: 'support_incident',
    label: '02 / High-Load Support Incident Triage & Key Routing',
    category: 'INFRASTRUCTURE SUPPORT',
    prompt: 'Diagnose sudden latency spike in Chatwoot Telegram queue: audit VLESS routing keys, classify 200+ waiting tickets, and patch autoresponder.',
    decomposition: [
      { step: 1, agent: 'orchestrator', action: 'Lock inbound ticket queue, partition incident severity into L1 vs L2 categories.' },
      { step: 2, agent: 'scout', action: 'Analyze network handshake logs across WireGuard & VLESS nodes, isolate failing DNS cluster.' },
      { step: 3, agent: 'executor', action: 'Generate automated status message for customers and Python script to reissue compromised access keys.' },
      { step: 4, agent: 'auditor', action: 'Simulate user reconnect loop, verify 0% packet loss on fallback relay.' },
      { step: 5, agent: 'orchestrator', action: 'Post incident post-mortem and update Chatwoot SLA benchmarks.' }
    ]
  },
  {
    id: 'telegram_intel',
    label: '03 / Autonomous Telegram Intelligence & Lead Pipeline',
    category: 'MTPROTO AUTOMATION',
    prompt: 'Deploy client-side MTProto event listener (Telethon): monitor keyword triggers across target channels, deduplicate leads, and push to CRM.',
    decomposition: [
      { step: 1, agent: 'orchestrator', action: 'Initialize MTProto session pool with anti-flood rotation and safe request intervals.' },
      { step: 2, agent: 'scout', action: 'Listen to event stream, filter out bots and duplicate messages using fuzzy matching.' },
      { step: 3, agent: 'executor', action: 'Format structured lead payload with sentiment score, build n8n webhook dispatcher.' },
      { step: 4, agent: 'auditor', action: 'Audit account health against Telegram FloodWait limits and verify token secrecy.' },
      { step: 5, agent: 'orchestrator', action: 'Activate live synchronization loop and report active throughput.' }
    ]
  }
];

class SwarmMissionController {
  constructor(eventBus) {
    this.bus = eventBus;
    this.isRunning = false;
    this.currentMission = null;
  }

  async runMission(presetOrPrompt, onStepCallback, stepDelay = 900) {
    if (this.isRunning) return null;
    this.isRunning = true;
    this.bus.startMission();

    let missionPlan;
    if (typeof presetOrPrompt === 'object' && presetOrPrompt.decomposition) {
      missionPlan = presetOrPrompt;
    } else {
      // Dynamic prompt decomposition
      const promptText = String(presetOrPrompt);
      missionPlan = {
        id: 'custom_' + Date.now(),
        label: 'CUSTOM / Autonomous Mission Directive',
        prompt: promptText,
        decomposition: [
          { step: 1, agent: 'orchestrator', action: `Analyze goal: "${promptText.substring(0, 60)}..." and construct task DAG.` },
          { step: 2, agent: 'scout', action: 'Execute automated research query, retrieve contextual data and constraints.' },
          { step: 3, agent: 'executor', action: 'Generate core system architecture, code deliverables, and specification.' },
          { step: 4, agent: 'auditor', action: 'Run automated QA check: verify edge cases, latency boundaries, and output validity.' },
          { step: 5, agent: 'orchestrator', action: 'Synthesize final mission report and package deployable artifacts.' }
        ]
      };
    }

    this.currentMission = missionPlan;

    this.bus.emit('MISSION_START', {
      mission: missionPlan.label,
      prompt: missionPlan.prompt,
      stepsCount: missionPlan.decomposition.length,
      timestamp: Date.now()
    });

    const d1 = Math.max(5, stepDelay);
    const d2 = Math.max(5, Math.floor(stepDelay * 1.3));
    const d3 = Math.max(5, Math.floor(stepDelay * 0.7));

    for (let i = 0; i < missionPlan.decomposition.length; i++) {
      if (!this.isRunning) break;
      const task = missionPlan.decomposition[i];
      const agent = AGENT_PERSONAS[task.agent];

      // 1. Agent enters thinking state
      this.bus.emit('AGENT_STATE_CHANGE', {
        agentId: agent.id,
        agentName: agent.name,
        state: 'THINKING',
        taskIndex: i,
        action: task.action,
        tokens: Math.floor(180 + Math.random() * 220)
      });
      await this.sleep(d1);

      // 2. Simulated tool invocation / processing
      this.bus.emit('TOOL_INVOKED', {
        agentId: agent.id,
        tool: task.agent === 'scout' ? 'web_search_query' : (task.agent === 'executor' ? 'code_interpreter' : 'dag_evaluator'),
        query: task.action,
        tokens: Math.floor(250 + Math.random() * 300)
      });
      await this.sleep(d2);

      // 3. Agent emits output chunk
      this.bus.emit('AGENT_OUTPUT', {
        agentId: agent.id,
        agentName: agent.name,
        step: i + 1,
        totalSteps: missionPlan.decomposition.length,
        summary: task.action,
        tokens: Math.floor(300 + Math.random() * 400)
      });
      await this.sleep(d3);

      // 4. Return to standby
      this.bus.emit('AGENT_STATE_CHANGE', {
        agentId: agent.id,
        agentName: agent.name,
        state: 'DONE',
        taskIndex: i
      });

      if (onStepCallback) onStepCallback(i + 1, missionPlan.decomposition.length);
    }

    // Emit final artifact
    const artifact = this.generateArtifact(missionPlan);
    this.bus.emit('ARTIFACT_GENERATED', artifact);

    this.bus.emit('MISSION_COMPLETE', {
      mission: missionPlan.label,
      totalDurationMs: this.bus.getElapsed(),
      telemetry: this.bus.telemetry
    });

    this.isRunning = false;
    return artifact;
  }

  stop() {
    this.isRunning = false;
    this.bus.emit('MISSION_ABORTED', { timestamp: Date.now() });
  }

  sleep(ms) {
    return new Promise(res => setTimeout(res, ms));
  }

  generateArtifact(mission) {
    const timeStr = new Date().toLocaleDateString('ru-RU');
    return {
      title: mission.label,
      generatedAt: timeStr,
      markdown: `# MISSION DIRECTIVE REPORT // ${mission.label}
**Status:** COMPLETED_VERIFIED
**Target Runtime:** Hybrid Node.js & Cloud Edge
**Security Signature:** 0x9f8b4a2e8c1

---

## 1. Executive Decomposition
${mission.decomposition.map(d => `- **[${d.agent.toUpperCase()}]** ${d.action}`).join('\n')}

---

## 2. Synthesized Architecture Deliverable
\`\`\`json
{
  "system_id": "operator_swarm_${Date.now().toString(36)}",
  "concurrency": "async_dag_dispatch",
  "target_platforms": ["Telegram_MTProto", "Ozon_Rich_API", "AmoCRM_Webhooks"],
  "sla_threshold_ms": 180,
  "validation_passed": true,
  "critic_score": 98.4
}
\`\`\`

## 3. QA Audit & Constraint Verification
- ✅ **Strict Payload Validation:** Zero cyclic leaks detected in execution graph.
- ✅ **Rate Limiting:** Managed request pooling enforced at 1500ms intervals.
- ✅ **Compliance:** Verified against operational constraints without data anomalies.
`,
      rawJson: {
        missionId: mission.id,
        verified: true,
        tokensSpent: this.bus.telemetry.totalTokens,
        estimatedCost: '$' + this.bus.telemetry.estimatedCost.toFixed(4),
        agentRoster: Object.keys(AGENT_PERSONAS)
      }
    };
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AGENT_PERSONAS, MISSION_PRESETS, SwarmMissionController };
}
