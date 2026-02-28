'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle, AlertTriangle, Calendar, Clock, DollarSign, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { apiClient } from '../../../../../lib/api/client';

export default function PayrollWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [runId, setRunId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [holidays, setHolidays] = useState<any[]>([]);

  // Form State
  const [periodStart, setPeriodStart] = useState(new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-01');
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().split('T')[0]);

  // Confirmations
  const [confirmedRegular, setConfirmedRegular] = useState(false);
  const [confirmedOvertime, setConfirmedOvertime] = useState(false);
  const [confirmedHolidays, setConfirmedHolidays] = useState(false);

  // 1. Initialize Run (Create Draft)
  const startRun = async () => {
    setLoading(true);
    try {
      // Create draft run
      const data = await apiClient.post<any>('/payroll/runs', { periodStart, periodEnd });
      setRunId(data.id);

      // Calculate first pass
      await calculate(data.id);

      setStep(2); // Move to Step 1 of validation (which is UI step 2)
    } catch (e) {
      console.error(e);
      alert('Failed to start payroll run');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const calculate = async (id: string) => {
    await apiClient.post(`/payroll/runs/${id}/calculate`);

    const payslipsData = await apiClient.get<any>(`/payroll/runs/${id}`);

    // Summarize
    let totalRegular = 0;
    let totalOvertime = 0;
    let totalHoliday = 0;

    if (payslipsData.payslips) {
      payslipsData.payslips.forEach((p: any) => {
        totalRegular += Number(p.regularHours);
        totalOvertime += Number(p.overtimeHours);
        totalHoliday += Number(p.publicHolidayHours);
      });
    }

    setStats({
      count: payslipsData.payslips?.length || 0,
      totalRegular,
      totalOvertime,
      totalHoliday
    });

    // Also fetch holidays in this period for display
    // const hRes = await fetch('http://localhost:3000/public-holidays');
    // const allHolidays = await hRes.json();
    // Filter locally or better yet, returned by calculate? 
    // Let's just mock the list display or fetch again.
  };

  // Finalize
  const finalizeRun = async () => {
    if (!runId) return;
    setLoading(true);
    try {
      await apiClient.post(`/payroll/runs/${runId}/lock`);
      router.push('/payroll'); // Go back to list
    } catch (e) {
      alert('Failed to finalize');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 text-gray-200">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/payroll/create" className="p-2 hover:bg-white/10 rounded-lg">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">New Payroll Run</h1>
      </div>

      {/* Wizard Progress */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10" />
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-gold text-obsidian' : 'bg-gray-800 text-gray-500'}`}>
            {s}
          </div>
        ))}
      </div>

      <div className="bg-[#1a1f1a] rounded-xl border border-white/10 p-8 min-h-[400px]">
        {/* STEP 1: CONFIG */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white">Select Pay Period</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Start Date</label>
                <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">End Date</label>
                <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg p-3" />
              </div>
            </div>
            <button onClick={startRun} disabled={loading} className="w-full py-4 mt-8 bg-blue-600 rounded-xl font-bold hover:bg-blue-500 transition">
              {loading ? 'Initializing...' : 'Start Calculation'}
            </button>
          </div>
        )}

        {/* STEP 2: REGULAR HOURS */}
        {step === 2 && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Clock className="text-blue-400" /> Confirm Regular Hours
            </h2>

            <div className="bg-black/30 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-white mb-2">{stats.totalRegular.toFixed(1)}</div>
              <div className="text-gray-400">Total Regular Hours</div>
              <div className="text-sm text-gray-500 mt-2">Across {stats.count} staff members</div>
            </div>

            <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
              <input type="checkbox" checked={confirmedRegular} onChange={e => setConfirmedRegular(e.target.checked)} className="w-5 h-5 rounded border-gray-600" />
              <span>I confirm the regular hours calculation appears correct.</span>
            </label>

            <button
              onClick={() => setStep(3)}
              disabled={!confirmedRegular}
              className="w-full py-4 mt-4 bg-gold text-obsidian rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Continue
            </button>
          </div>
        )}

        {/* STEP 3: OVERTIME */}
        {step === 3 && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="text-orange-400" /> Confirm Overtime
            </h2>

            <div className="bg-black/30 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-white mb-2">{stats.totalOvertime.toFixed(1)}</div>
              <div className="text-gray-400">Total Overtime Hours</div>
              <div className="text-sm text-orange-400 mt-2">Rate: 1.5x Multiplier</div>
            </div>

            <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
              <input type="checkbox" checked={confirmedOvertime} onChange={e => setConfirmedOvertime(e.target.checked)} className="w-5 h-5 rounded border-gray-600" />
              <span>I confirm these overtime hours are valid for pay.</span>
            </label>

            <button
              onClick={() => setStep(4)}
              disabled={!confirmedOvertime}
              className="w-full py-4 mt-4 bg-gold text-obsidian rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm & Continue
            </button>
          </div>
        )}

        {/* STEP 4: HOLIDAYS */}
        {step === 4 && stats && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="text-purple-400" /> Confirm Public Holidays
            </h2>

            <div className="bg-black/30 p-6 rounded-lg text-center">
              <div className="text-4xl font-bold text-white mb-2">{stats.totalHoliday.toFixed(1)}</div>
              <div className="text-gray-400">Total Holiday Hours</div>
              <div className="text-sm text-purple-400 mt-2">Rate: 2.0x Multiplier</div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <h3 className="text-sm font-bold text-gray-400 mb-2">Dates Detected in Period:</h3>
              <div className="text-sm">
                {/* Mocking for display if we didn't fetch details */}
                Check &quot;Settings &gt; Holidays&quot; if you suspect missing dates.
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 border border-white/10 rounded-lg cursor-pointer hover:bg-white/5">
              <input type="checkbox" checked={confirmedHolidays} onChange={e => setConfirmedHolidays(e.target.checked)} className="w-5 h-5 rounded border-gray-600" />
              <span>I confirm the public holiday dates are correct.</span>
            </label>

            <button
              onClick={finalizeRun}
              disabled={!confirmedHolidays || loading}
              className="w-full py-4 mt-4 bg-gold text-obsidian rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : <CheckCircle />}
              FINALIZE PAYROLL
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
