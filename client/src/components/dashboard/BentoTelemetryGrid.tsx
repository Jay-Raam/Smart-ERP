import React from 'react';
import { SpotlightCard } from '../ui/SpotlightCard';
import { AnimatedCounter } from '../ui/AnimatedCounter';
import { Sparkline } from '../ui/Sparkline';
import { Database, Zap, ArrowUpRight, Cpu, Activity, ShieldCheck } from 'lucide-react';
import { SystemTelemetryData } from '../../hooks/useTenantData';

interface BentoProps {
  telemetry?: SystemTelemetryData;
}

export const BentoTelemetryGrid: React.FC<BentoProps> = ({ telemetry }) => {
  const latencySparkData = [0.48, 0.45, 0.44, 0.42, 0.41, 0.43, 0.42];
  const auditSparkData = [1.8, 2.0, 2.1, 2.3, 2.38, 2.41, 2.42];
  const workerSparkData = [99.8, 99.85, 99.9, 99.95, 99.98, 99.98, 99.99];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {/* Card 1: Main PostgreSQL Metric (Spans 2 cols) */}
      <SpotlightCard className="md:col-span-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-[#D4FF00] animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-widest text-[#888888]">
              PostgreSQL Tenant Cluster
            </span>
          </div>
          <span className="rounded-full border border-[#D4FF00]/30 bg-[#D4FF00]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#D4FF00]">
            ISOLATION: ACTIVE
          </span>
        </div>

        <div className="mt-6 flex items-end justify-between">
          <div>
            <div className="text-4xl font-semibold tracking-tight text-white flex items-center gap-2">
              <AnimatedCounter value={telemetry?.activeSchemas || 128} />
              <span className="text-xl font-normal text-[#888888]">Active Schemas</span>
            </div>
            <p className="mt-1 text-sm text-[#888888]">
              Dynamic schema leasing average latency:{' '}
              <span className="font-mono text-[#D4FF00]">
                {telemetry?.schemaLeaseLatencyMs || 0.42}ms
              </span>
            </p>
          </div>
          <div className="hidden sm:block">
            <Sparkline data={latencySparkData} color="#D4FF00" width={110} height={32} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-t border-white/[0.06] pt-4 text-xs font-mono text-[#888888]">
          <div>
            POOL: <span className="text-white">{telemetry?.dbPoolActive || 18} / {telemetry?.dbPoolMax || 20} MAX</span>
          </div>
          <div>
            IDLE TIMEOUT: <span className="text-white">30s</span>
          </div>
          <div>
            SSL: <span className="text-[#D4FF00]">VERIFIED TLSv1.3</span>
          </div>
        </div>
      </SpotlightCard>

      {/* Card 2: MongoDB Audit Throughput */}
      <SpotlightCard glowColor="rgba(0, 240, 255, 0.08)">
        <div className="flex items-center justify-between text-[#888888]">
          <Database className="h-4 w-4 text-[#00F0FF]" />
          <span className="text-[10px] font-mono text-[#00F0FF]">ATLAS CLUSTER</span>
        </div>
        <div className="mt-6">
          <div className="text-3xl font-semibold tracking-tight text-white flex items-baseline gap-1">
            <AnimatedCounter value={2.4} decimals={1} />
            <span className="text-lg">M</span>
          </div>
          <div className="text-xs text-[#888888] mt-0.5">Immutable Audit Logs Ingested</div>
        </div>
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="text-[11px] font-mono text-[#00F0FF]">
            TTL: 365-Day Auto-Prune
          </div>
          <Sparkline data={auditSparkData} color="#00F0FF" width={70} height={20} />
        </div>
      </SpotlightCard>

      {/* Card 3: BullMQ Workers */}
      <SpotlightCard glowColor="rgba(212, 255, 0, 0.08)">
        <div className="flex items-center justify-between text-[#888888]">
          <Zap className="h-4 w-4 text-[#D4FF00]" />
          <span className="text-[10px] font-mono text-[#D4FF00]">HEALTHY</span>
        </div>
        <div className="mt-6">
          <div className="text-3xl font-semibold tracking-tight text-white flex items-baseline gap-1">
            <AnimatedCounter value={telemetry?.webhookDeliveryRate || 99.98} decimals={2} />
            <span className="text-lg">%</span>
          </div>
          <div className="text-xs text-[#888888] mt-0.5">Webhook Delivery Rate</div>
        </div>
        <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/[0.04]">
          <div className="text-[11px] font-mono text-[#888888]">
            HMAC-SHA256 Signed
          </div>
          <Sparkline data={workerSparkData} color="#D4FF00" width={70} height={20} />
        </div>
      </SpotlightCard>
    </div>
  );
};
