import { Users, Heart, DollarSign, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { type DashboardStats } from '@/lib/api/admin';

interface Props {
  stats: DashboardStats | null;
}

const COLORS = ['#e1e0e3', '#7c39f6', '#ec5ec2'];

export function AdminOverview({ stats }: Props) {
  if (!stats) return null;

  const activity = stats.dailyActivity;
  const latest = activity[activity.length - 1];
  const previous = activity[activity.length - 2];

  const percentChange = (current = 0, prev = 0) => {
    if (!prev) return '0%';
    const value = Math.round(((current - prev) / prev) * 100);
    return `${value >= 0 ? '+' : ''}${value}%`;
  };

  const statCards = [
    { title: 'Total Users', value: stats.stats.users.total, change: percentChange(latest?.users, previous?.users), icon: Users, color: 'bg-blue-100 text-blue-700' },
    { title: 'Active Today', value: stats.stats.users.online, change: percentChange(latest?.users, previous?.users), icon: Activity, color: 'bg-green-100 text-green-700' },
    { title: 'New Matches', value: stats.stats.matches.today, change: percentChange(latest?.matches, previous?.matches), icon: Heart, color: 'bg-pink-100 text-pink-700' },
    { title: 'Premium Users', value: stats.stats.users.premium, change: percentChange(stats.stats.subscriptions.premium + stats.stats.subscriptions.pro, previous?.users), icon: DollarSign, color: 'bg-purple-100 text-purple-700' },
  ];

  const subscriptionData = [
    { name: 'Free', value: stats.stats.subscriptions.free },
    { name: 'Premium', value: stats.stats.subscriptions.premium },
    { name: 'Pro', value: stats.stats.subscriptions.pro },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-neutral-500">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change} from last week</p>
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={stats.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e1e0e3" />
                <XAxis dataKey="date" stroke="#9f9ea2" fontSize={12} />
                <YAxis stroke="#9f9ea2" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="users" stroke="#7c39f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="messages" stroke="#3ccf91" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={subscriptionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {subscriptionData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {subscriptionData.map((item, index) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm text-neutral-600">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
