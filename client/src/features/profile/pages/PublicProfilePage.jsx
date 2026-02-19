import React from 'react';
import { useParams } from 'react-router-dom';
import ProfileInfoWidget from '@/features/dashboard/components/widgets/ProfileInfoWidget';

export default function PublicProfilePage() {
  const { username } = useParams();

  return (
    <div className="min-h-screen bg-[#164A41] p-6">
      <div className="max-w-2xl mx-auto">
        <ProfileInfoWidget mode="username" username={username} title="Публічний профіль" />
      </div>
    </div>
  );
}
