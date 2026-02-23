import React from 'react';
import AppLayout from '../../../../components/layout/AppLayout';

export default function DashboardLayout({ topBar, leftPanel, rightPanel }) {
  return (
    <AppLayout
      topBar={topBar}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      snowfallCount={100}
    />
  );
}