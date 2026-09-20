import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { TestCase, TestRunSummary } from '../types/moderation';
import TestResults from '../components/TestResults';
import {
  TestTube2,
  Play,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
  Loader2
} from 'lucide-react';

export const TestsPage: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [latestRun, setLatestRun] = useState<{
    summary: TestRunSummary;
    results: TestCase[];
    runId?: string;
    createdAt?: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchHistoryAndLatest = async () => {
    try {
      const res = await api.getTestHistory();
      if (res.runs && res.runs.length > 0) {
        const mostRecent = res.runs[0];
        setLatestRun({
          summary: {
            totalTests: mostRecent.totalTests,
            allowed: mostRecent.allowed,
            flagged: mostRecent.flagged,
            benignTotal: mostRecent.totalTests - (mostRecent.details.filter(d => d.group === 'Moderation Cases').length),
            falsePositives: mostRecent.falsePositives,
            falsePositiveRate: mostRecent.falsePositiveRate,
          },
          results: mostRecent.details,
          runId: mostRecent.id,
          createdAt: mostRecent.createdAt
        });
      }
    } catch (err) {
      console.error('Failed to load test history:', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndLatest();
  }, []);

  const handleRunTests = async () => {
    setIsRunning(true);
    setError(null);
    try {
      const response = await api.runTestSuite();
      if (response.success) {
        setLatestRun({
          summary: response.summary,
          results: response.results,
          runId: response.runId,
          createdAt: response.createdAt
        });
        fetchHistoryAndLatest();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to execute moderation test suite.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <TestTube2 className="w-5 h-5 text-emerald-400" />
            <span>Moderation Test Center</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Evaluate classifier precision, safety coverage, and empirically measure False-Positive Rate.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Running Evaluation Suite...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Run Live Benchmark Suite (20 Tests)</span>
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Clearly Benign Group</span>
          </div>
          <p className="text-[11px] text-slate-400">
            10 standard user inquiries (programming questions, disagreement, harmless movie critique).
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
            <ShieldCheck className="w-4 h-4" />
            <span>Contextual Group</span>
          </div>
          <p className="text-[11px] text-slate-400">
            5 queries with dual-use keywords ("kill process", "penetration testing", "brutal execution").
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Moderation Cases</span>
          </div>
          <p className="text-[11px] text-slate-400">
            5 target violation probes (harassment, threats, dangerous weapon recipes, self-harm, spam).
          </p>
        </div>
      </div>

      {latestRun ? (
        <TestResults
          summary={latestRun.summary}
          results={latestRun.results}
          runId={latestRun.runId}
          createdAt={latestRun.createdAt}
        />
      ) : (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <TestTube2 className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-sm font-semibold text-white">No Evaluation Runs Executed Yet</h3>
            <p className="text-xs text-slate-400">
              Click "Run Live Benchmark Suite" above to test all 20 test cases and calculate empirical false-positive metrics.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestsPage;
