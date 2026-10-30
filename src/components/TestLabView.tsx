import { useState } from 'react';
import {
  Flame,
  ShieldAlert,
  RefreshCw,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Info,
  Clock,
  Lock,
} from 'lucide-react';
import {
  DocumentItem,
  SystemHealth,
} from '../types';
import {
  testLabTamper,
  testLabRestore,
  testLabToggleStorage,
  testLabToggleDb,
  triggerScheduledJob,
  verifyDocument,
} from '../api';

interface TestLabViewProps {
  documents: DocumentItem[];
  systemHealth: SystemHealth | null;
  onRefresh: () => Promise<void>;
  onNavigateToAlerts: () => void;
}

export function TestLabView({
  documents,
  systemHealth,
  onRefresh,
  onNavigateToAlerts,
}: TestLabViewProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    documents[0]?.id || ''
  );

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [resultLog, setResultLog] = useState<string | null>(null);
  const [logType, setLogType] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  // 1. Simulate File Tampering
  const handleTamper = async () => {
    if (!selectedDocId) return;
    setLoadingAction('tamper');
    try {
      const res = await testLabTamper(selectedDocId);
      await onRefresh();
      setLogType('warning');
      setResultLog(
        `[TAMPER INJECTED]: Physical byte manipulation executed on "${selectedDoc?.originalFilename}". The file bytes on storage disk have been mutated! Run verification to test detection.`
      );
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Tamper injection failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Run Verification on the selected document
  const handleVerifySelected = async () => {
    if (!selectedDocId) return;
    setLoadingAction('verify');
    try {
      const res = await verifyDocument(selectedDocId);
      await onRefresh();
      if (res.isMatch) {
        setLogType('success');
        setResultLog(
          `[VERIFICATION PASSED]: Document "${selectedDoc?.originalFilename}" cryptographic SHA-256 signature matches registered baseline. Integrity intact.`
        );
      } else {
        setLogType('error');
        setResultLog(
          `[CRITICAL MISMATCH DETECTED]: Cryptographic deviation identified!\n• Baseline Hash: ${res.baselineHash}\n• Stored File Hash: ${res.calculatedHash}\nAutomatic Security Alert has been dispatched.`
        );
      }
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Verification execution returned error: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Restore Pristine File from Baseline
  const handleRestore = async () => {
    if (!selectedDocId) return;
    setLoadingAction('restore');
    try {
      const res = await testLabRestore(selectedDocId);
      await onRefresh();
      setLogType('success');
      setResultLog(
        `[RESTORE COMPLETE]: Pristine bytes restored for "${selectedDoc?.originalFilename}". SHA-256 cryptographic match restored, active incident marked resolved.`
      );
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Restore failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 4. Toggle Storage Fault
  const handleToggleStorage = async () => {
    setLoadingAction('storage');
    try {
      const res = await testLabToggleStorage();
      await onRefresh();
      setLogType(res.storageUnavailable ? 'warning' : 'success');
      setResultLog(
        res.storageUnavailable
          ? `[FAULT SIMULATION ACTIVE]: Storage subsystem simulated failure. Verification will now report STORAGE_ERROR rather than false positives.`
          : `[FAULT SIMULATION CLEARED]: Storage subsystem restored to operational state.`
      );
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Storage toggle failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 5. Toggle Database Timeout
  const handleToggleDb = async () => {
    setLoadingAction('db');
    try {
      const res = await testLabToggleDb();
      await onRefresh();
      setLogType(res.databaseTimeout ? 'warning' : 'success');
      setResultLog(
        res.databaseTimeout
          ? `[FAULT SIMULATION ACTIVE]: Database timeout active. APIs will return HTTP 503 DB_UNAVAILABLE with fault tolerance retry handling.`
          : `[FAULT SIMULATION CLEARED]: Database connection online.`
      );
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Database toggle failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 6. Trigger Scheduled Background Job
  const handleTriggerScheduler = async () => {
    setLoadingAction('scheduler');
    try {
      const res = await triggerScheduledJob();
      await onRefresh();
      setLogType('info');
      setResultLog(
        `[SCHEDULER RUN]: Batch verification triggered. Checked: ${res.result?.verifiedCount || 0} intact, ${res.result?.mismatchCount || 0} mismatches, ${res.result?.storageErrorCount || 0} storage faults.`
      );
    } catch (err: any) {
      setLogType('error');
      setResultLog(`Scheduler trigger failed: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
              Integrity & Fault Tolerance Test Lab
            </h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#4776D0]/10 text-[#243B6B] border border-[#4776D0]/20">
              Interactive Sandbox
            </span>
          </div>
          <p className="text-xs text-[#64748B] max-w-2xl">
            Simulate attacks, silent storage corruption, and hardware outages to evaluate
            TraceLock's SHA-256 detection and automatic alerting in real time.
          </p>
        </div>

        <button
          onClick={onNavigateToAlerts}
          className="px-4 py-2 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-lg shadow-xs transition-colors whitespace-nowrap self-start sm:self-auto cursor-pointer"
        >
          View Alerts Dashboard &rarr;
        </button>
      </div>

      {/* Target Document Selector Strip */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-[#172033] mb-1.5">
            Select Document for Attack & Integrity Simulation:
          </label>
          <select
            value={selectedDocId}
            onChange={(e) => setSelectedDocId(e.target.value)}
            className="w-full max-w-md py-2 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#172033] text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#4776D0]"
          >
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.originalFilename} ({d.category}) — [Status: {d.verificationStatus}]
              </option>
            ))}
          </select>
        </div>

        {selectedDoc && (
          <div className="text-xs sm:text-right border-t sm:border-t-0 sm:border-l border-[#E2E8F0] sm:pl-4 pt-3 sm:pt-0">
            <span className="text-[#64748B] block text-[11px]">Current Status:</span>
            <span
              className={`font-semibold inline-block mt-0.5 ${
                selectedDoc.verificationStatus === 'VERIFIED'
                  ? 'text-[#15966A]'
                  : selectedDoc.verificationStatus === 'MISMATCH_DETECTED'
                  ? 'text-[#DC2626]'
                  : 'text-[#D97706]'
              }`}
            >
              {selectedDoc.verificationStatus}
            </span>
            <div className="font-mono text-[10px] text-slate-400 mt-1">
              Baseline: {selectedDoc.sha256Baseline.substring(0, 16)}...
            </div>
          </div>
        )}
      </div>

      {/* Test Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Scenario 1: Inject Byte Tampering */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-[#DC2626] flex items-center justify-center mb-3">
              <Flame className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              1. Simulate Storage Byte Tampering
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Simulates an external attacker or rogue process modifying bytes of the document in private storage.
            </p>
          </div>

          <button
            onClick={handleTamper}
            disabled={loadingAction === 'tamper'}
            className="w-full py-2 px-3 text-xs font-semibold text-[#DC2626] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loadingAction === 'tamper' ? 'Mutating Bytes...' : 'Inject Byte Tampering'}</span>
          </button>
        </div>

        {/* Scenario 2: Verify Cryptographic Integrity */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#4776D0]/10 text-[#243B6B] flex items-center justify-center mb-3">
              <ShieldAlert className="w-5 h-5 text-[#4776D0]" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              2. Run Immediate Hash Verification
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Recalculates SHA-256 hash of the stored bytes and compares with the registered baseline reference.
            </p>
          </div>

          <button
            onClick={handleVerifySelected}
            disabled={loadingAction === 'verify'}
            className="w-full py-2 px-3 text-xs font-semibold text-white bg-[#243B6B] hover:bg-[#1A2C52] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loadingAction === 'verify' ? 'Calculating Hash...' : 'Verify Cryptographic Integrity'}</span>
          </button>
        </div>

        {/* Scenario 3: Restore from Baseline */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-[#15966A] flex items-center justify-center mb-3">
              <RotateCcw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              3. One-Click Pristine Recovery
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Restores untouched bytes from the pristine baseline vault and resolves the active security incident.
            </p>
          </div>

          <button
            onClick={handleRestore}
            disabled={loadingAction === 'restore'}
            className="w-full py-2 px-3 text-xs font-semibold text-[#15966A] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{loadingAction === 'restore' ? 'Restoring File...' : 'Restore from Pristine Baseline'}</span>
          </button>
        </div>

        {/* Scenario 4: Storage Volume Fault */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-[#D97706] flex items-center justify-center mb-3">
              <HardDrive className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              4. Simulate Storage Volume Fault
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Simulates unreadable or locked disk files. Verifies that TraceLock never reports false success on read failure.
            </p>
          </div>

          <button
            onClick={handleToggleStorage}
            disabled={loadingAction === 'storage'}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              systemHealth?.simulations.storageUnavailable
                ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                : 'bg-slate-50 text-[#172033] hover:bg-slate-100 border-[#E2E8F0]'
            }`}
          >
            <span>
              {systemHealth?.simulations.storageUnavailable
                ? 'Clear Storage Failure'
                : 'Simulate Storage Failure'}
            </span>
          </button>
        </div>

        {/* Scenario 5: Database Connection Timeout */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#4776D0] flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              5. Simulate Database Timeout
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Simulates database connection timeout and tests error handling and backoff retry logic.
            </p>
          </div>

          <button
            onClick={handleToggleDb}
            disabled={loadingAction === 'db'}
            className={`w-full py-2 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
              systemHealth?.simulations.databaseTimeout
                ? 'bg-rose-50 text-[#DC2626] border-rose-200'
                : 'bg-slate-50 text-[#172033] hover:bg-slate-100 border-[#E2E8F0]'
            }`}
          >
            <span>
              {systemHealth?.simulations.databaseTimeout
                ? 'Clear DB Timeout'
                : 'Simulate DB Timeout'}
            </span>
          </button>
        </div>

        {/* Scenario 6: Trigger Continuous Scheduler */}
        <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-lg bg-[#243B6B]/10 text-[#243B6B] flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-[#243B6B]" />
            </div>
            <h3 className="text-sm font-semibold text-[#172033] mb-1">
              6. Run Periodic Scheduler Now
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed mb-4">
              Forces immediate execution of the background verification cycle across all registered documents with deduplication.
            </p>
          </div>

          <button
            onClick={handleTriggerScheduler}
            disabled={loadingAction === 'scheduler'}
            className="w-full py-2 px-3 text-xs font-semibold text-[#243B6B] bg-slate-50 hover:bg-slate-100 border border-[#E2E8F0] rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAction === 'scheduler' ? 'animate-spin' : ''}`} />
            <span>Trigger Scheduler Cycle</span>
          </button>
        </div>
      </div>

      {/* Live Test Execution Console Output */}
      {resultLog && (
        <div className="bg-[#172033] text-slate-100 p-5 rounded-xl font-mono text-xs shadow-lg space-y-2 border border-slate-700">
          <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-700 pb-2">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#15966A]"></span>
              <span>TEST LAB EXECUTION LOG</span>
            </span>
            <span>{new Date().toLocaleTimeString()}</span>
          </div>
          <pre className="whitespace-pre-wrap leading-relaxed text-[11px] font-mono">{resultLog}</pre>
        </div>
      )}

      {/* Engineering Capstone Verification Notes */}
      <div className="bg-white p-5 rounded-xl border border-[#E2E8F0] shadow-xs text-xs text-[#64748B] space-y-2">
        <div className="font-semibold text-[#172033] flex items-center gap-2">
          <Info className="w-4 h-4 text-[#243B6B]" />
          <span>Evaluation Checklist for Project Examiners</span>
        </div>
        <p className="leading-relaxed">
          1. <strong className="text-[#172033]">Deterministic Detection:</strong> Tampering flips file bytes. SHA-256 calculation guarantees mathematical divergence without false positives.
        </p>
        <p className="leading-relaxed">
          2. <strong className="text-[#172033]">Alert Deduplication:</strong> Multiple scheduled checks of a tampered file do not spam duplicate alert records in the database.
        </p>
        <p className="leading-relaxed">
          3. <strong className="text-[#172033]">Safe Baseline Governance:</strong> The system forbids silent hash replacement; an authorized human must approve changes with recorded audit notes.
        </p>
      </div>
    </div>
  );
}
