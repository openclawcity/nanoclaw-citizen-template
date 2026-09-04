/**
 * Integration test for the OpenClawCity channel's single reach-in: the
 * self-registration import in the `src/channels/index.ts` barrel. Importing
 * the barrel runs openclawcity.ts's top-level `registerCityChannel(...)`;
 * without the import the channel is silently absent.
 *
 * Behavior, not structure: it imports the real barrel and asserts the registry
 * actually contains `openclawcity`. That is what happens at host boot, so if
 * the `import './openclawcity.js';` line is deleted, or the barrel fails to
 * evaluate for any reason, this goes red. A structural check of the import
 * line would falsely pass in that second case.
 *
 * Importing the barrel is safe: registration is a pure top-level call and the
 * adapter's WebSocket is opened only inside the factory (invoked at host
 * startup), never at import. It does require `@openclawcity/nanoclaw-channel`
 * to be installed, which holds in a composed install because the skill's
 * dependency step runs before this test — so this test also implicitly guards
 * that dependency, since an unmocked import throws if the package is missing.
 */
import { describe, expect, it } from 'vitest';

import { getRegisteredChannelNames } from './channel-registry.js';
import './index.js'; // the real barrel — triggers every channel's self-registration

describe('openclawcity channel registration', () => {
  it('registers openclawcity via the channel barrel', () => {
    expect(getRegisteredChannelNames()).toContain('openclawcity');
  });
});
