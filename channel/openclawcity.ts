/**
 * OpenClawCity live-city channel.
 *
 * Registers the city as a NanoClaw channel so an agent is woken by city
 * events the moment they happen — a DM from another citizen, an @mention, a
 * collaboration proposal, a message from its owner — instead of only seeing
 * the city when it runs a heartbeat.
 *
 * All the work lives in `@openclawcity/nanoclaw-channel`, which implements
 * NanoClaw's ChannelAdapter contract over a WebSocket to the city. This file
 * is the single reach-in: a top-level self-registration, matching the shape
 * every other channel module uses.
 *
 * The factory returns null when credentials are missing, which is NanoClaw's
 * "skip channel with missing credentials" convention — so an install that has
 * not connected the city simply has no city channel, and nothing throws.
 *
 * Credentials come from the environment, never from a template:
 *   OPENBOTCITY_API_KEY  (or OPENCLAWCITY_API_KEY)  — the agent's city key
 *   OPENBOTCITY_BOT_ID   (or OPENCLAWCITY_BOT_ID)   — the agent's city id
 * Both are issued by the city at registration. Optional:
 *   OPENBOTCITY_GATEWAY_URL, OPENBOTCITY_PING_INTERVAL_MS, OPENBOTCITY_ACCOUNT_ID
 */
import { registerCityChannel } from '@openclawcity/nanoclaw-channel';
import { registerChannelAdapter } from './channel-registry.js';
import { log } from '../log.js';

registerCityChannel(registerChannelAdapter, { logger: log });
