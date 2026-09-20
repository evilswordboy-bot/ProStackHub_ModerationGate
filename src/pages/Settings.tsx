import React, { useState, useEffect } from 'react';
import { api, getAdminToken } from '../services/api';
import type { SystemSettings } from '../types/moderation';
import {
  Settings,
  Database,
  Lock,
  CheckCircle2,
  Info,
  Trash2,
  Save,
  Server
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [, setSettings] = useState<SystemSettings>({});
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Form states
  const [modelName, setModelName] = useState('gemini-1.5-flash');
  const [strictness, setStrictness] = useState('standard');
  const [autoLogSafe, setAutoLogSafe] = useState('true');

  // Admin Auth Dialog State
  const [, setAdminKey] = useState(getAdminToken());
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginStatus, setLoginStatus] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings) {
        setSettings(res.settings);
        if (res.settings.model_name) setModelName(res.settings.model_name);
        if (res.settings.strictness) setStrictness(res.settings.strictness);
        if (res.settings.auto_log_safe) setAutoLogSafe(res.settings.auto_log_safe);
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveNotice(null);
    try {
      await api.updateSettings({
        model_name: modelName,
        strictness: strictness,
        auto_log_safe: autoLogSafe
      });
      setSaveNotice('Settings successfully saved to persistent database.');
      setTimeout(() => setSaveNotice(null), 4000);
    } catch (err: any) {
      setSaveNotice(`Failed to save: ${err.message}`);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginStatus(null);
    try {
      const res = await api.adminLogin(adminUsername, adminPassword);
      if (res.success && res.token) {
        setAdminKey(res.token);
        setLoginStatus('Admin authenticated successfully.');
        fetchSettings();
      } else {
        setLoginStatus(res.error || 'Invalid credentials');
      }
    } catch (err: any) {
      setLoginStatus('Authentication error: ' + err.message);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm('Are you sure you want to reset all conversation and moderation audit records?')) {
      return;
    }
    try {
      await api.resetDatabase();
      setResetNotice('All database records have been reset successfully.');
      setTimeout(() => setResetNotice(null), 4000);
    } catch (err: any) {
      setResetNotice(`Reset failed: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" />
          <span>System Settings & Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Manage AI moderation engine settings, safety thresholds, and audit storage.
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-white">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Privacy & Processing Notice</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          Messages submitted to this application may be processed by the configured AI moderation service.
        </p>
        <p className="text-[11px] text-slate-400">
          Messages evaluated as safe are stored locally for session continuity; flagged messages are retained in the database for compliance, human review, and audit trail verification.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-semibold text-white">Moderation Provider</h3>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Google Gemini AI</span>
          </span>
        </div>

        <form onSubmit={handleSaveSettings} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="model-select" className="block text-xs font-medium text-slate-300 mb-1.5">
                Target AI Model
              </label>
              <select
                id="model-select"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast & Low Latency)</option>
                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen Multimodal)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
              </select>
            </div>

            <div>
              <label htmlFor="strictness-select" className="block text-xs font-medium text-slate-300 mb-1.5">
                Policy Strictness
              </label>
              <select
                id="strictness-select"
                value={strictness}
                onChange={(e) => setStrictness(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="standard">Standard (Balanced False-Positive Minimization)</option>
                <option value="strict">Strict (High Sensitivity on Edge Content)</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="log-retention-select" className="block text-xs font-medium text-slate-300 mb-1.5">
              Log Retention for Safe Messages
            </label>
            <select
              id="log-retention-select"
              value={autoLogSafe}
              onChange={(e) => setAutoLogSafe(e.target.value)}
              className="w-full sm:w-80 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="true">Store audit event & truncated snippet</option>
              <option value="minimal">Store anonymized event only</option>
            </select>
          </div>

          {saveNotice && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
              {saveNotice}
            </div>
          )}

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md shadow-emerald-950/40 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </form>
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-semibold text-white">Admin Authentication</h3>
        </div>
        <p className="text-xs text-slate-400">
          Admin endpoints are protected on the server. Configure credentials below or pass <code className="text-slate-300 font-mono">x-admin-key</code> in request headers.
        </p>

        <form onSubmit={handleAdminLogin} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div>
            <label htmlFor="admin-user-input" className="block text-[11px] font-medium text-slate-400 mb-1">Username</label>
            <input
              id="admin-user-input"
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label htmlFor="admin-password-input" className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
            <input
              id="admin-password-input"
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Default: AdminGate@2026"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors"
            >
              Verify Credentials
            </button>
          </div>
        </form>

        {loginStatus && (
          <p className="text-xs text-emerald-400 font-medium">{loginStatus}</p>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center gap-2.5">
          <Database className="w-5 h-5 text-rose-400" />
          <h3 className="text-sm font-semibold text-white">Database Management</h3>
        </div>
        <p className="text-xs text-slate-400">
          Reset all messages, moderation events, flagged content records, and test run histories.
        </p>

        {resetNotice && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            {resetNotice}
          </div>
        )}

        <button
          onClick={handleResetData}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Reset Database Records</span>
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
