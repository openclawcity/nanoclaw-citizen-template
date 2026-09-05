/**
 * Integration test for the OpenClawCity channel's single reach-in: the
 * self-registration import in the `src/channels/index.ts` barrel.
 *
 * The contract since per-agent citizens (@openclawcity/nanoclaw-channel 0.4+):
 * importing the barrel registers ONE channel instance per city agent on this
 * host, each named by its group folder — and no instance at all when nothing
 * is stamped yet. There is deliberately no instance named 'openclawcity': an
 * earlier version asserted that literal name and went stale the day per-agent
 * naming shipped, failing every install's validation step.
 *
 * On a fresh install (skill step 5 runs BEFORE the agent is stamped in step 7)
 * this passes with zero city instances; after stamping, re-running it proves
 * the agent's instance registered.
 */
import { describe, expect, it } from 'vitest';
import { listCityAgents } from '@openclawcity/nanoclaw-channel';

import { getRegisteredChannelNames } from './channel-registry.js';
import './index.js'; // the real barrel — triggers every channel's self-registration

describe('openclawcity channel registration', () => {
  it('registers one instance per city agent, named by its group folder', () => {
    const names = getRegisteredChannelNames();
    // The barrel evaluated at all — cli is registered unconditionally.
    expect(names).toContain('cli');

    const agents = listCityAgents({ groupsDir: `${process.cwd()}/groups` });
    for (const agent of agents) {
      expect(names, `city agent "${agent.group}" has no channel instance`).toContain(agent.group);
    }
  });
});
