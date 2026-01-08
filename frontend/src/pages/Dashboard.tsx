import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Package, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Clock,
  Activity
} from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import { api } from '../lib/api';
import { format } from 'date-fns';

interface Session {
  sessionId: string;
  status: string;
  totalProducts: number;
  verifiedCount: number;
  failedCount: number;
  flaggedCount: number;
  createdAt: string;
}

interface HealthStatus {
  status: string;
  services: {
    database: { status: string };
    openai: { status: string };
    xai: { status: string };
    salesforce: { status: string };
  };
}

export default function Dashboard() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    verified: 0,
    failed: 0,
    flagged: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [healthRes] = await Promise.all([
        api.get<HealthStatus>('/health/detailed'),
      ]);
      setHealth(healthRes.data);
      
      // Mock stats for demo - in real app would come from API
      setStats({
        totalProducts: 1250,
        verified: 1180,
        failed: 25,
        flagged: 45,
      });

      // Mock recent sessions
      setSessions([
        {
          sessionId: 'sess-001',
          status: 'completed',
          totalProducts: 150,
          verifiedCount: 145,
          failedCount: 2,
          flaggedCount: 3,
          createdAt: new Date().toISOString(),
        },
        {
          sessionId: 'sess-002',
          status: 'processing',
          totalProducts: 75,
          verifiedCount: 30,
          failedCount: 0,
          flaggedCount: 0,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-500 mt-1">Overview of catalog verification status</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Products"
          value={stats.totalProducts.toLocaleString()}
          icon={<Package className="w-6 h-6" />}
          color="blue"
        />
        <StatCard
          title="Verified"
          value={stats.verified.toLocaleString()}
          icon={<CheckCircle className="w-6 h-6" />}
          color="green"
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          title="Failed"
          value={stats.failed.toLocaleString()}
          icon={<XCircle className="w-6 h-6" />}
          color="red"
        />
        <StatCard
          title="Flagged for Review"
          value={stats.flagged.toLocaleString()}
          icon={<AlertCircle className="w-6 h-6" />}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sessions */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Recent Sessions</h2>
            <Link to="/sessions" className="text-primary-600 text-sm hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-4">
            {sessions.map((session) => (
              <Link
                key={session.sessionId}
                to={`/sessions/${session.sessionId}`}
                className="block p-4 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{session.sessionId}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {session.totalProducts} products
                    </p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={session.status} />
                    <p className="text-xs text-gray-400 mt-2">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {format(new Date(session.createdAt), 'MMM d, h:mm a')}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-4 text-sm">
                  <span className="text-green-600">✓ {session.verifiedCount} verified</span>
                  <span className="text-red-600">✗ {session.failedCount} failed</span>
                  <span className="text-yellow-600">⚠ {session.flaggedCount} flagged</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-6">System Status</h2>
          
          <div className="space-y-4">
            <ServiceStatus 
              name="API Server" 
              status={health?.status || 'unknown'} 
            />
            <ServiceStatus 
              name="Database" 
              status={health?.services.database.status || 'unknown'} 
            />
            <ServiceStatus 
              name="OpenAI" 
              status={health?.services.openai.status || 'unknown'} 
            />
            <ServiceStatus 
              name="xAI (Grok)" 
              status={health?.services.xai.status || 'unknown'} 
            />
            <ServiceStatus 
              name="Salesforce" 
              status={health?.services.salesforce.status || 'unknown'} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ServiceStatus({ name, status }: { name: string; status: string }) {
  const isUp = status === 'up' || status === 'healthy';
  
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-gray-400" />
        <span className="text-sm">{name}</span>
      </div>
      <span className={`flex items-center gap-1 text-sm ${isUp ? 'text-green-600' : 'text-red-600'}`}>
        <span className={`w-2 h-2 rounded-full ${isUp ? 'bg-green-500' : 'bg-red-500'}`}></span>
        {isUp ? 'Operational' : 'Down'}
      </span>
    </div>
  );
}
