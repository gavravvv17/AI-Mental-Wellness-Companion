import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';

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
  const [authView, setAuthView] = useState('login'); // 'login' | 'signup' | 'forgot-password'
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!user) {
    if (authView === 'signup') {
      return <Signup setAuthView={setAuthView} />;
    } else if (authView === 'forgot-password') {
      return <ForgotPassword setAuthView={setAuthView} />;
    }
    return <Login setAuthView={setAuthView} />;
  }

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
