#!/usr/bin/env tsx
import { audit } from './audit.ts';

const report = audit();
if (!report.ok) process.exitCode = 1;
