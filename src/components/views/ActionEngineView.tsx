/**
 * NEXUS AI - Security Action Engine & Execution Gate
 * 
 * Implements strict security-first action gate:
 * - Risk Assessment: LOW | MEDIUM | HIGH | CRITICAL
 * - Action Lifecycle:
 *   PROPOSED -> VALIDATED -> USER CONFIRMATION REQUIRED -> APPROVED/REJECTED -> EXECUTED IN SANDBOX -> RESULT VERIFIED
 * - Command / payload inspection preview
 * - Prompt injection scanner defenses
 * - Sandboxed execution simulation with stdout/stderr verification
 */

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Eye,
  Filter,
  Layers,
  ChevronRight,
  Code,
  Shield,
  Activity,
  FileCode,
  CheckSquare
} from 'lucide-react';
import { ActionProposal, RiskLevel } from '../../types/index.js';
import { useApp } from '../../context/AppContext.js';

export const ActionEngineView: React.FC = () => {
  const { addToast } = useApp();
  const [proposals, setProposals] = useState<ActionProposal[]>([]);
  const [auditStats, setAuditStats] = useState<any>(null);
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [selectedProposal, setSelectedProposal] = useState<ActionProposal | null>(null);
  const [showProposeModal, setShowProposeModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // New action proposal form
  const [newTitle, setNewTitle] = useState('');
  const [newCommand, setNewCommand] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newReason, setNewReason] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [resActions, resAudit] = await Promise.all([
        fetch('/api/actions'),
        fetch('/api/security/audit'),
      ]);
      const dataActions = await resActions.json();
      const dataAudit = await resAudit.json();
      setProposals(dataActions.proposals || []);
      setAuditStats(dataAudit);
    } catch (err) {
      console.error('Failed to load actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      const res = await fetch(`/api/actions/${id}/approve`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Action proposal approved by user.', 'Security Gate');
        await loadData();
      }
    } catch {
      addToast('error', 'Approval failed.');
    }
  };

  const handleReject = async (id: string) => {
    try {
      const res = await fetch(`/api/actions/${id}/reject`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('info', 'Action rejected and marked blocked.', 'Security Gate');
        await loadData();
      }
    } catch {
      addToast('error', 'Rejection failed.');
    }
  };

  const handleExecute = async (id: string) => {
    try {
      const res = await fetch(`/api/actions/${id}/execute`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        addToast('success', 'Executed inside local isolated sandbox with verified zero egress.', 'Sandbox Verified');
        await loadData();
      } else {
        addToast('error', data.error || 'Execution blocked by security policy.');
      }
    } catch (err: any) {
      addToast('error', err.message || 'Execution error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/actions/${id}`, { method: 'DELETE' });
      addToast('info', 'Action proposal deleted.');
      await loadData();
    } catch {
      addToast('error', 'Delete failed');
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    try {
      const res = await fetch('/api/actions/propose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          command: newCommand,
          description: newDesc,
          reason: newReason || 'User manual security test proposal',
          source: 'manual',
        }),
      });
      const data = await res.json();
      if (data.success) {
        addToast('success', `Proposal generated: assessed risk [${data.proposal.riskLevel.toUpperCase()}]`);
        setNewTitle('');
        setNewCommand('');
        setNewDesc('');
        setNewReason('');
        setShowProposeModal(false);
        await loadData();
      }
    } catch (err: any) {
      addToast('error', err.message || 'Failed to submit proposal');
    }
  };

  const getRiskBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40">
            CRITICAL RISK
          </span>
        );
      case 'high':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/40">
            HIGH RISK
          </span>
        );
      case 'medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            MEDIUM RISK
          </span>
        );
      case 'low':
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            LOW RISK
          </span>
        );
    }
  };

  const filteredProposals = proposals.filter(p => {
    if (filterRisk === 'all') return true;
    return p.riskLevel === filterRisk;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-indigo-400" />
              <span>Action Engine & Security Gate</span>
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              SANDBOX ENFORCED
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Zero unconfirmed shell commands, automated risk classification, and sandbox isolation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg bg-[#0c0f17] hover:bg-[#121622] text-neutral-400 hover:text-neutral-200 border border-white/[0.08] transition-colors cursor-pointer"
            title="Refresh Actions"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowProposeModal(true)}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Propose New Action</span>
          </button>
        </div>
      </div>

      {/* Security Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-[#0c0f17]/90 border border-white/[0.07] space-y-1">
          <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
            Total Proposals
          </div>
          <div className="text-lg font-bold text-neutral-100 font-mono">
            {auditStats?.totalProposals ?? proposals.length}
          </div>
          <div className="text-[10px] text-cyan-400">Classified by Action Gate</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0c0f17]/90 border border-rose-500/30 bg-rose-500/[0.02] space-y-1">
          <div className="text-[10px] font-mono text-rose-300 uppercase tracking-wider">
            Critical High Risk
          </div>
          <div className="text-lg font-bold text-rose-400 font-mono">
            {auditStats?.highRiskBlocked ?? proposals.filter(p => p.riskLevel === 'critical' || p.riskLevel === 'high').length}
          </div>
          <div className="text-[10px] text-rose-400/80">Require User Confirmation</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0c0f17]/90 border border-amber-500/30 bg-amber-500/[0.02] space-y-1">
          <div className="text-[10px] font-mono text-amber-300 uppercase tracking-wider">
            Pending User Gate
          </div>
          <div className="text-lg font-bold text-amber-300 font-mono">
            {proposals.filter(p => !p.userApproved && !p.executed).length}
          </div>
          <div className="text-[10px] text-amber-400/80">Awaiting user review</div>
        </div>

        <div className="p-3 rounded-xl bg-[#0c0f17]/90 border border-emerald-500/30 bg-emerald-500/[0.02] space-y-1">
          <div className="text-[10px] font-mono text-emerald-300 uppercase tracking-wider">
            Executed in Sandbox
          </div>
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {proposals.filter(p => p.executed).length}
          </div>
          <div className="text-[10px] text-emerald-400">Zero Cloud Egress</div>
        </div>
      </div>

      {/* Action Lifecycle Guide */}
      <div className="p-3 rounded-xl bg-neutral-950/80 border border-white/[0.06] flex items-center justify-between text-[11px] overflow-x-auto gap-2">
        <span className="font-mono text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          Mandatory Action Lifecycle:
        </span>
        <div className="flex items-center gap-2 font-mono text-[10px] text-neutral-300 shrink-0">
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-white/[0.06]">1. PROPOSED</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-white/[0.06]">2. VALIDATED</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-500/30">3. CONFIRMATION</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-neutral-900 border border-white/[0.06]">4. APPROVED</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-500/30">5. SANDBOX</span>
          <span>→</span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">6. VERIFIED</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs">
          <Filter className="w-3.5 h-3.5 text-neutral-500 mr-1" />
          {['all', 'critical', 'high', 'medium', 'low'].map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1 rounded-lg uppercase font-mono text-[10px] transition-colors ${
                filterRisk === r
                  ? 'bg-neutral-800 text-white font-bold border border-white/[0.12]'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-neutral-500">
          Prompt Injection Defense: Active
        </span>
      </div>

      {/* Automated Security Isolation Audit Banner */}
      {auditStats?.isolationAudit && (
        <div className="p-4 rounded-xl bg-[#090b12] border border-cyan-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-semibold text-neutral-200">
                Automated Security & Data Isolation Audit
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {auditStats.isolationAudit.allPassed ? 'ALL 6 TESTS PASSED' : 'ACTION REQUIRED'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
            {auditStats.isolationAudit.results.map((r: any, idx: number) => (
              <div key={idx} className="p-2.5 rounded-lg bg-neutral-900/60 border border-white/[0.04] space-y-1">
                <div className="flex items-center justify-between text-neutral-300">
                  <span className="truncate">{r.test}</span>
                  <span className={r.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                    {r.passed ? 'PASS' : 'FAIL'}
                  </span>
                </div>
                <div className="text-[10px] text-neutral-400 line-clamp-1">{r.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Proposals List */}
      <div className="space-y-3">
        {filteredProposals.length === 0 ? (
          <div className="p-8 text-center text-xs text-neutral-400 font-mono rounded-xl border border-white/[0.06] bg-[#0c0f17]/60">
            No action proposals match this risk filter.
          </div>
        ) : (
          filteredProposals.map(proposal => {
            const isApproved = proposal.userApproved;
            const isExecuted = proposal.executed;
            const isBlocked = proposal.sandboxStatus === 'blocked';

            return (
              <div
                key={proposal.id}
                className={`p-4 rounded-xl border transition-all space-y-3 ${
                  isExecuted
                    ? 'bg-neutral-900/40 border-emerald-500/25'
                    : isBlocked
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-[#0e121e]/90 border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {getRiskBadge(proposal.riskLevel)}
                    <span className="text-xs font-bold text-neutral-100">{proposal.title}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-400 border border-white/[0.05]">
                      {(proposal.actionType || 'COMMAND').toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isExecuted ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> EXECUTED IN SANDBOX
                      </span>
                    ) : isApproved ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> USER APPROVED
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> CONFIRMATION REQUIRED
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(proposal.id)}
                      className="p-1 text-neutral-500 hover:text-rose-400 rounded transition-colors"
                      title="Delete proposal"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Description & Reason */}
                <div className="text-xs text-neutral-300 space-y-1">
                  <p>{proposal.description}</p>
                  <p className="text-[11px] text-neutral-400 flex items-center gap-1">
                    <strong className="text-neutral-300">Target Reason:</strong> {proposal.reason}
                  </p>
                </div>

                {/* Command Payload Preview */}
                {proposal.command && (
                  <div className="p-2.5 rounded-lg bg-neutral-950/90 border border-white/[0.06] font-mono text-xs space-y-1">
                    <div className="text-[10px] text-neutral-500 uppercase flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Terminal className="w-3 h-3 text-cyan-400" />
                        Command Payload Preview
                      </span>
                      <span>Target: Isolated Shell Runner</span>
                    </div>
                    <div className="text-cyan-300 font-mono text-[11px] select-all break-all">
                      $ {proposal.command}
                    </div>
                  </div>
                )}

                {/* Prompt Injection / Safety Violations Alert */}
                {proposal.safetyViolations && proposal.safetyViolations.length > 0 && (
                  <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-300 space-y-0.5">
                    <div className="font-semibold flex items-center gap-1.5 text-rose-400">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      Security Gate Blocked Violations:
                    </div>
                    {proposal.safetyViolations.map((v, i) => (
                      <div key={i} className="text-rose-200 text-[10px] font-mono">
                        • {v}
                      </div>
                    ))}
                  </div>
                )}

                {/* Output Result if Executed */}
                {proposal.outputResult && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 font-mono text-[11px] text-emerald-300 space-y-1">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sandbox Verified Output
                    </div>
                    <div>{proposal.outputResult}</div>
                  </div>
                )}

                {/* Action Gate Controls */}
                {!isExecuted && (
                  <div className="pt-2 border-t border-white/[0.05] flex flex-wrap items-center justify-between gap-2">
                    <div className="text-[11px] text-neutral-400 font-mono">
                      Origin: <span className="text-neutral-200 capitalize">{proposal.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isApproved && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReject(proposal.id)}
                            className="px-3 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApprove(proposal.id)}
                            className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Action</span>
                          </button>
                        </>
                      )}

                      {(isApproved || proposal.riskLevel === 'low') && (
                        <button
                          type="button"
                          onClick={() => handleExecute(proposal.id)}
                          className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Execute in Sandbox</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* New Proposal Modal */}
      {showProposeModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-lg bg-[#0e111a] border border-white/[0.1] rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                <Shield className="w-4 h-4" />
                <span>Propose Action to Security Gate</span>
              </div>
              <button
                type="button"
                onClick={() => setShowProposeModal(false)}
                className="text-neutral-400 hover:text-neutral-200 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProposal} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Action Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Install missing dependency, export memory..."
                  className="w-full bg-neutral-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Terminal Command / Payload (Optional)
                </label>
                <input
                  type="text"
                  value={newCommand}
                  onChange={e => setNewCommand(e.target.value)}
                  placeholder="e.g. npm install @qualcomm/qnn-ep or git status"
                  className="w-full bg-neutral-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs font-mono text-cyan-300 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Action Description
                </label>
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  rows={2}
                  placeholder="Detailed description of what will execute..."
                  className="w-full bg-neutral-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-neutral-400 uppercase mb-1">
                  Security Justification / Reason
                </label>
                <input
                  type="text"
                  value={newReason}
                  onChange={e => setNewReason(e.target.value)}
                  placeholder="Why is this action needed?"
                  className="w-full bg-neutral-950 border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setShowProposeModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold"
                >
                  Evaluate Risk & Propose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
