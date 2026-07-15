import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';

// Feature Pages (to be implemented next)
import Dashboard from './pages/Dashboard';
import MoodTracker from './pages/MoodTracker';
import Journal from './pages/Journal';
import LifeTimeline from './pages/LifeTimeline';
import Analytics from './pages/Analytics';
import Mindfulness from './pages/Mindfulness';
import TrustedCircle from './pages/TrustedCircle';
import Chatbot from './pages/Chatbot';

const AppContent = () => {
  const { user } = useAuth();
  const [authView, setAuthView] = useState('login'); // 'login' or 'signup'
  const [currentTab, setCurrentTab] = useState('dashboard');

  // Guard routes: if not authenticated, show login/signup screens
  if (!user) {
    return authView === 'login' 
      ? <Login setAuthView={setAuthView} /> 
      : <Signup setAuthView={setAuthView} />;
  }

  // Active view router based on currentTab state
  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard setCurrentTab={setCurrentTab} />;
      case 'mood':
        return <MoodTracker setCurrentTab={setCurrentTab} />;
      case 'journal':
        return <Journal />;
      case 'timeline':
        return <LifeTimeline />;
      case 'analytics':
        return <Analytics />;
      case 'mindfulness':
        return <Mindfulness />;
      case 'circle':
        return <TrustedCircle />;
      case 'chatbot':
        return <Chatbot />;
      default:
        return <Dashboard setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} setCurrentTab={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
