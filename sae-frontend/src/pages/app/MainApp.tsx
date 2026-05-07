import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../../components/Layout/MainLayout';
import Dashboard from '../Dashboard';
import Biblioteca from '../Biblioteca';
import ChatIA from '../ChatIA';
import AdminPanel from '../AdminPanel';
import ForumList from '../forum/ForumList';
import QuestionDetail from '../forum/QuestionDetail';
import ChatRoom from '../forum/ChatRoom';
import Validations from '../forum/Validations';

const MainApp: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="biblioteca" element={<Biblioteca />} />
        <Route path="chat" element={<ChatIA />} />
        <Route path="admin" element={<AdminPanel />} />
        <Route path="forum" element={<ForumList />} />
        <Route path="forum/room/:id" element={<ChatRoom />} />
        <Route path="forum/questions/:id" element={<QuestionDetail />} />
        <Route path="forum/new" element={<Navigate to="/app/forum" replace />} />
        <Route path="forum/validations" element={<Validations />} />
      </Routes>
    </MainLayout>
  );
};

export default MainApp;
