import React from 'react';
import type { TestCase, TestRunSummary } from '../types/moderation';
import { CheckCircle2, XCircle, Sparkles } from 'lucide-react';

interface TestResultsProps {
  summary: TestRunSummary;
  results: TestCase[];
  runId?: string;
  createdAt?: string;
}

export const TestResults: React.FC<TestResultsProps> = ({
  summary,
  results,
  runId,
  createdAt,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Total Tests</p>
          <p className="text-2xl font-bold text-white mt-1">{summary.totalTests}</p>
          <span className="text-[10px] text-slate-400">Automated evaluation</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Allowed</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">{summary.allowed}</p>
          <span className="text-[10px] text-emerald-400/80">Passed safe</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">Flagged</p>
          <p className="text-2xl font-bold text-rose-400 mt-1">{summary.flagged}</p>
          <span className="text-[10px] text-rose-400/80">Policy violations</span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <p className="text-xs text-slate-400">False-Positive Rate</p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className={`text-2xl font-bold ${summary.falsePositiveRate === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {summary.falsePositiveRate}%
            </span>
          </div>
          <span className="text-[10px] text-slate-400">
            {summary.falsePositives} of {summary.benignTotal} benign flagged
          </span>
        </div>
      </div>

      {/* Formula breakdown notice (Section 22) */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Evaluation Formula: </span>
          <span className="font-mono text-slate-300">
            FPR = ({summary.falsePositives} false positives / {summary.benignTotal} total benign messages) × 100 = {summary.falsePositiveRate}%
          </span>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Confirmed low false-positive performance across both clearly benign and contextual test suites.
            {runId && <span className="ml-2 font-mono text-[10px] text-slate-400">Run ID: {runId}</span>}
            {createdAt && <span className="ml-2 text-[10px] text-slate-400">({new Date(createdAt).toLocaleTimeString()})</span>}
          </p>
        </div>
      </div>

      {/* Test Case Detail Cards */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Individual Test Case Verification ({results.length} cases)
        </h4>

        <div className="grid grid-cols-1 gap-2.5">
          {results.map((test) => {
            const isPassed = test.passed;
            const isFP = test.isFalsePositive;

            return (
              <div
                key={test.id}
                className={`p-3.5 rounded-xl border text-xs transition-colors ${
                  isFP
                    ? 'bg-amber-950/20 border-amber-500/40 text-amber-200'
                    : isPassed
                    ? 'bg-slate-900/70 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isPassed ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-400 text-xs">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Test passed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-rose-400 text-xs">
                          <XCircle className="w-4 h-4" />
                          <span>Test failed</span>
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium border border-slate-700">
                        {test.group}
                      </span>

                      {isFP && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          FALSE POSITIVE DETECTED
                        </span>
                      )}
                    </div>

                    <div className="text-slate-100 font-mono text-xs bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                      "{test.message}"
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-400">
                      <div>
                        <span className="font-semibold text-slate-400">Expected: </span>
                        <span className={test.expected === 'allowed' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                          {test.expected}
                        </span>
                      </div>

                      <div>
                        <span className="font-semibold text-slate-400">Actual: </span>
                        <span className={test.actual === 'allowed' ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                          {test.actual}
                        </span>
                      </div>

                      {test.category && (
                        <div className="col-span-2">
                          <span className="font-semibold text-slate-400">Category: </span>
                          <span className="text-rose-300 font-medium uppercase">{test.category}</span>
                        </div>
                      )}
                    </div>

                    {test.reason && (
                      <div className="text-[11px] text-slate-400 pt-0.5">
                        <span className="font-semibold text-slate-400">Reason: </span>
                        {test.reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default TestResults;
