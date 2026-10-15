'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { History, Shield, ArrowLeft, Filter } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { formatDateTime } from '@/lib/utils';

export default function AuditLogsPage() {
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => apiRequest('/audit?limit=50'),
  });

  const logs = auditData?.logs || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#06111f] flex items-center gap-2">
          <History className="w-6 h-6 text-[#f37021]" />
          System Audit Logs
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Immutable trail of administrative actions, assessment publishing, and qualification changes.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading audit records...</div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">No audit logs recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Administrator</th>
                  <th className="pb-3">Action</th>
                  <th className="pb-3">Resource</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {logs.map((log: any) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="py-3 text-slate-500">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3 font-sans">
                      <div className="font-semibold text-slate-900">
                        {log.userEmail || 'System'}
                      </div>
                      <div className="text-[10px] text-orange-600 font-mono font-bold">{log.role || 'Super Admin'}</div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded bg-orange-50 border border-orange-200 text-orange-700 text-[10px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 text-slate-700">
                      {log.resourceType}{' '}
                      {log.resourceId && (
                        <span className="text-slate-400 text-[10px]">
                          ({log.resourceId.slice(-6)})
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-[11px] font-sans text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details || {})}
                    </td>
                    <td className="py-3 text-slate-500 text-[11px]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
