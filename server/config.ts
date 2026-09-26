/**
 * NEXUS AI - Central Configuration
 */

import os from 'os';

export interface NexusConfig {
  appName: string;
  version: string;
  port: number;
  host: string;
  env: string;
  dbPath: string;
  targetPlatform: string;
  isSnapdragon: boolean;
  allowCloudFallback: boolean;
}

const isSnapdragon =
  process.platform === 'win32' &&
  (process.arch === 'arm64' || process.arch === 'arm');

export const config: NexusConfig = {
  appName: 'NEXUS AI Desktop Foundation',
  version: '1.0.0-m1',
  port: 3000,
  host: '0.0.0.0',
  env: process.env.NODE_ENV || 'development',
  dbPath: process.env.NEXUS_DB_PATH || 'nexus.db',
  targetPlatform: 'Windows on Snapdragon (HP OmniBook X / EliteBook Ultra)',
  isSnapdragon,
  allowCloudFallback: process.env.ALLOW_CLOUD_FALLBACK === 'true',
};
