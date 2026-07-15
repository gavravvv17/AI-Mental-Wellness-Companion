import React, { useState, useEffect } from 'react';
import API from '../services/api';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, BarElement, ArcElement, Title, Tooltip, Legend
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { BarChart3, Moon, Dumbbell, Calendar, HelpCircle } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend);

const tooltipStyle = {
  backgroundColor: '#ffffff',
  titleColor: '#2D3748',
  bodyColor: '#6B7280',
  borderColor: '#E2E6ED',
  borderWidth: 1,
  padding: 10,
  cornerRadius: 12,
  titleFont: { family: 'Poppins', size: 12, weight: '600' },
  bodyFont: { family: 'Poppins', size: 11 },
};

const StatCard = ({ label, value, icon: Icon, color, bg }) => (
  <div className="card p-5" style={{ borderRadius: '20px' }}>
    <div className="flex items-center justify-between mb-1">
      <p className="text-[10px] font-bold uppercase tracking-widest text-ink-400">{label}</p>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
    </div>
    <p className="text-3xl font-bold mt-1" style={{ color }}>{value}</p>
  </div>
);

const ChartCard = ({ title, subtitle, height = 'h-60', children }) => (
  <div className="card p-6" style={{ borderRadius: '24px' }}>
    <h3 className="font-bold text-ink-800 mb-0.5">{title}</h3>
    {subtitle && <p className="text-xs text-ink-400 mb-4">{subtitle}</p>}
    <div className={`${height} relative`}>{children}</div>
  </div>
);

const Analytics = () => {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, h] = await Promise.all([API.get('/mood/stats'), API.get('/mood/history')]);
        setStats(s.data);
        setHistory(h.data.reverse());
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  if (loading) return (
    <div className="space-y-5 page-in animate-pulse">
      <div className="skeleton h-10 w-64 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[1,2,3].map(i=><div key={i} className="skeleton h-20 rounded-2xl"/>)}</div>
      <div className="grid grid-cols-2 gap-4">{[1,2].map(i=><div key={i} className="skeleton h-64 rounded-3xl"/>)}</div>
      <div className="skeleton h-72 rounded-3xl" />
    </div>
  );

  const hasData = history.length > 0;

  const moodColors = {
    Happy: 'rgba(251,191,36,0.75)', Calm: 'rgba(76,175,80,0.75)',
    Energetic: 'rgba(249,115,22,0.75)', Stressed: 'rgba(239,68,68,0.75)',
    Anxious: 'rgba(139,92,246,0.75)', Sad: 'rgba(14,165,233,0.75)',
  };
  const moodCounts = stats?.moodCounts || {};
  const moodLabels = Object.keys(moodCounts);

  const doughnutData = {
    labels: moodLabels,
    datasets: [{ data: Object.values(moodCounts), backgroundColor: moodLabels.map(l => moodColors[l] || 'rgba(156,163,175,0.75)'), borderWidth: 2, borderColor: '#ffffff', hoverOffset: 6 }]
  };
  const doughnutOpts = {
    responsive: true, maintainAspectRatio: false, cutout: '65%',
    plugins: { legend: { position: 'right', labels: { color: '#4a5568', font: { family: 'Poppins', size: 11 }, padding: 12, usePointStyle: true, pointStyleWidth: 8 } }, tooltip: { ...tooltipStyle } }
  };

  const last7 = history.slice(-7);
  const dateLabels = last7.map(l => new Date(l.date).toLocaleDateString('en-US', { month:'short', day:'numeric' }));

  const lineData = {
    labels: dateLabels,
    datasets: [{ label: 'Energy', data: last7.map(l => l.energyLevel), fill: true, backgroundColor: 'rgba(139,92,246,0.08)', borderColor: '#8b5cf6', tension: 0.4, pointBackgroundColor: '#8b5cf6', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7 }]
  };
  const lineOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: { y: { min:1, max:10, grid: { color:'rgba(0,0,0,0.05)', drawBorder:false }, ticks: { color:'#9ca3af', font:{ family:'Poppins', size:10 } } }, x: { grid:{display:false}, ticks:{color:'#9ca3af', font:{family:'Poppins', size:10}} } },
    plugins: { legend:{display:false}, tooltip: tooltipStyle }
  };

  const barData = {
    labels: dateLabels,
    datasets: [
      { label:'Sleep (hrs)', data:last7.map(l=>l.sleepHours), backgroundColor:'rgba(139,92,246,0.25)', borderColor:'#8b5cf6', borderWidth:2, borderRadius:8, yAxisID:'y1' },
      { label:'Energy', type:'line', data:last7.map(l=>l.energyLevel), borderColor:'#f59e0b', borderWidth:2.5, tension:0.3, pointBackgroundColor:'#f59e0b', pointBorderColor:'#fff', pointBorderWidth:2, pointRadius:5, fill:false, yAxisID:'y2' }
    ]
  };
  const barOpts = {
    responsive: true, maintainAspectRatio: false,
    scales: {
      y1: { type:'linear', position:'left', min:0, max:12, grid:{color:'rgba(0,0,0,0.05)', drawBorder:false}, ticks:{color:'#9ca3af', font:{family:'Poppins', size:10}}, title:{display:true, text:'Sleep hrs', color:'#8b5cf6', font:{family:'Poppins', size:10, weight:'600'}} },
      y2: { type:'linear', position:'right', min:1, max:10, grid:{drawOnChartArea:false}, ticks:{color:'#9ca3af', font:{family:'Poppins', size:10}}, title:{display:true, text:'Energy', color:'#f59e0b', font:{family:'Poppins', size:10, weight:'600'}} },
      x: { grid:{display:false}, ticks:{color:'#9ca3af', font:{family:'Poppins', size:10}} }
    },
    plugins: { legend:{labels:{color:'#4a5568', font:{family:'Poppins', size:11}, usePointStyle:true, pointStyleWidth:8, padding:14}}, tooltip: tooltipStyle }
  };

  return (
    <div className="space-y-5 page-in">
      <div>
        <h2 className="text-2xl font-bold text-ink-800">Wellness Insights 📊</h2>
        <p className="text-sm text-ink-400 mt-1">Discover patterns in your emotions and daily habits over time.</p>
      </div>

      {!hasData ? (
        <div className="card p-14 text-center max-w-sm mx-auto space-y-4" style={{ borderRadius: '28px' }}>
          <span className="text-6xl">📈</span>
          <h3 className="font-bold text-ink-800">No data yet</h3>
          <p className="text-xs text-ink-400">Log a few days of moods and your insights will bloom here! 🌱</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Total Logs" value={stats?.totalLogs || 0} icon={Calendar} color="#8b5cf6" bg="#f5f0ff" />
            <StatCard label="Avg Sleep" value={stats?.averageSleep > 0 ? `${stats.averageSleep.toFixed(1)} hrs` : '—'} icon={Moon} color="#0ea5e9" bg="#f0f8ff" />
            <StatCard label="Avg Exercise" value={stats?.averageExercise > 0 ? `${stats.averageExercise.toFixed(0)} min` : '—'} icon={Dumbbell} color="#4caf50" bg="#f0faf0" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ChartCard title="Mood Distribution" subtitle="How often you experience each emotional state">
              <Doughnut data={doughnutData} options={doughnutOpts} />
            </ChartCard>
            <ChartCard title="Energy Trend" subtitle={`Last ${last7.length} logged days`}>
              <Line data={lineData} options={lineOpts} />
            </ChartCard>
          </div>

          <div className="card p-6" style={{ borderRadius: '24px' }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-ink-800">Sleep × Energy Correlation</h3>
                <p className="text-xs text-ink-400 mt-0.5">Bars = sleep · Line = energy level per day</p>
              </div>
              <div className="relative group">
                <div className="p-1.5 rounded-lg cursor-help" style={{ background: '#F7F9FC', border: '1px solid #E2E6ED' }}>
                  <HelpCircle className="w-3.5 h-3.5 text-ink-400" />
                </div>
                <div className="absolute bottom-full right-0 mb-2 w-60 p-3 text-[10px] text-ink-500 leading-relaxed rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                  style={{ background: '#ffffff', border: '1px solid #E2E6ED' }}>
                  Compare sleep hours against energy to find your personal sleep-energy sweet spot.
                </div>
              </div>
            </div>
            <div className="h-72 relative">
              <Bar data={barData} options={barOpts} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
