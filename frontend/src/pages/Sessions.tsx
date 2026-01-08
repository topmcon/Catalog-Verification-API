import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { format } from 'date-fns';

interface Session {
  sessionId: string;
  status: string;
  totalProducts: number;
  verifiedCount: number;
  failedCount: number;
  flaggedCount: number;
  processingTimeMs: number;
  createdAt: string;
  completedAt?: string;
}

export default function Sessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    // Mock data - in real app would fetch from API
    setSessions([
      {
        sessionId: 'sess-abc123',
        status: 'completed',
        totalProducts: 150,
        verifiedCount: 145,
        failedCount: 2,
        flaggedCount: 3,
        processingTimeMs: 45000,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      {
        sessionId: 'sess-def456',
        status: 'processing',
        totalProducts: 75,
        verifiedCount: 30,
        failedCount: 0,
        flaggedCount: 0,
        processingTimeMs: 0,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        sessionId: 'sess-ghi789',
        status: 'partial',
        totalProducts: 200,
        verifiedCount: 180,
        failedCount: 10,
        flaggedCount: 10,
        processingTimeMs: 120000,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        completedAt: new Date(Date.now() - 86400000 + 120000).toISOString(),
      },
    ]);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Verification Sessions</h1>
          <p className="text-gray-500 mt-1">View and manage verification sessions</p>
        </div>
        <Link to="/verify" className="btn-primary">
          New Verification
        </Link>
      </div>

      <div className="card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Session ID</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Products</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Results</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Duration</th>
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Created</th>
              <th className="text-left py-3 px-4"></th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.sessionId} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-4 px-4">
                  <span className="font-mono text-sm">{session.sessionId}</span>
                </td>
                <td className="py-4 px-4">
                  <StatusBadge status={session.status} />
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm">{session.totalProducts}</span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-3 text-sm">
                    <span className="text-green-600">{session.verifiedCount} ✓</span>
                    <span className="text-red-600">{session.failedCount} ✗</span>
                    <span className="text-yellow-600">{session.flaggedCount} ⚠</span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <span className="text-sm text-gray-500">
                    {session.processingTimeMs > 0 
                      ? `${(session.processingTimeMs / 1000).toFixed(1)}s`
                      : '-'
                    }
                  </span>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-1 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {format(new Date(session.createdAt), 'MMM d, yyyy h:mm a')}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <Link 
                    to={`/sessions/${session.sessionId}`}
                    className="text-primary-600 hover:text-primary-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
