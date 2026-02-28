'use client';
import { ShieldCheck, Info } from 'lucide-react';

interface MandatoryStats {
    totalPaye: number;
    totalUif: number;
    totalSdl: number;
}

interface Props {
    stats: MandatoryStats;
}

export default function MandatoryDeductionsSummary({ stats }: Props) {
    const totalCompliance = stats.totalPaye + stats.totalUif + stats.totalSdl;

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Total Compliance Card */}
            <div className="card p-4 border-l-4 border-blue-500 bg-blue-500/5">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] text-blue-400 uppercase tracking-wider font-bold">Total Statutory Owed</p>
                        <h3 className="text-xl font-bold text-white">R {totalCompliance.toFixed(2)}</h3>
                    </div>
                </div>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mb-2">
                    <Info className="w-3 h-3" /> Combined PAYE, UIF & SDL to remit to SARS
                </p>
                <a
                    href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/payroll/emp201?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`}
                    target="_blank"
                    className="flex justify-center items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-lg hover:bg-blue-400 transition w-full"
                >
                    View EMP201 Summary
                </a>
            </div>

            {/* PAYE */}
            <div className="card p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">PAYE (Employee Tax)</p>
                <div className="flex items-end justify-between">
                    <h4 className="text-lg font-bold text-white">R {stats.totalPaye.toFixed(2)}</h4>
                    <span className="text-[10px] text-gray-500">Progressive Rate</span>
                </div>
            </div>

            {/* UIF */}
            <div className="card p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">UIF (Combined 2%)</p>
                <div className="flex items-end justify-between">
                    <h4 className="text-lg font-bold text-white">R {stats.totalUif.toFixed(2)}</h4>
                    <span className="text-[10px] text-gray-500">Emp: 1% / Empr: 1%</span>
                </div>
            </div>

            {/* SDL */}
            <div className="card p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium mb-1">SDL (Skills Levy)</p>
                <div className="flex items-end justify-between">
                    <h4 className="text-lg font-bold text-white">R {stats.totalSdl.toFixed(2)}</h4>
                    <span className="text-[10px] text-gray-500">Employer 1%</span>
                </div>
            </div>
        </div>
    );
}
