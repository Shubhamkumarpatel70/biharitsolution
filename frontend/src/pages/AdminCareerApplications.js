import React, { useEffect, useState } from 'react';
import axios from '../axios';
import { Icon } from '../components/icons';

function AdminCareerApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await axios.get('/api/auth/admin/career-applications');
        setApplications(res.data.applications || []);
      } catch {
        setError('Could not load applications.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const extFromMime = (mime) => {
    if (mime === 'application/pdf') return '.pdf';
    if (mime === 'application/msword') return '.doc';
    if (mime?.includes('wordprocessingml')) return '.docx';
    return '';
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <Icon name="document" className="w-5 h-5" />
          </span>
          Career applications
        </h2>
        <p className="text-sm text-slate-500">{applications.length} total</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-slate-500 text-sm">Loading…</div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No applications yet.</div>
        ) : (
          <table className="w-full text-sm text-left min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Phone</th>
                <th className="px-4 py-3 font-semibold">City / State</th>
                <th className="px-4 py-3 font-semibold">Resume</th>
                <th className="px-4 py-3 font-semibold">Applied</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {applications.map((a) => {
                const title = a.career?.title || '—';
                const safeName = (a.resumeFileName || 'resume').replace(/[/\\?%*:|"<>]/g, '-');
                const downloadName = safeName.includes('.') ? safeName : `${safeName}${extFromMime(a.resumeMimeType)}`;
                return (
                  <tr key={a._id} className="hover:bg-slate-50/80 text-slate-800">
                    <td className="px-4 py-3 font-medium text-slate-900 max-w-[140px]">{title}</td>
                    <td className="px-4 py-3">{a.name}</td>
                    <td className="px-4 py-3">
                      <a href={`mailto:${a.email}`} className="text-primary-600 hover:underline">
                        {a.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{a.phone}</td>
                    <td className="px-4 py-3">
                      {a.city}, {a.state}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-slate-500 truncate max-w-[200px]" title={a.resumeFileName}>
                          {a.resumeFileName}
                        </span>
                        {a.resumeData && (
                          <a
                            href={a.resumeData}
                            download={downloadName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-primary-600 font-semibold text-xs hover:underline w-fit"
                          >
                            <Icon name="download" className="w-3.5 h-3.5" />
                            View / download
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap text-xs">
                      {a.createdAt ? new Date(a.createdAt).toLocaleString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default AdminCareerApplications;
