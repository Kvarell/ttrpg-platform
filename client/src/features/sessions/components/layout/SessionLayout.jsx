import React from 'react';
import AppLayout from '../../../../components/layout/AppLayout';

/**
 * SessionLayout — лейаут сторінки сесії.
 * Повторює паттерн DashboardLayout (70/30, topBar + left + right).
 *
 * @param {React.ReactNode} topBar — верхня навігація
 * @param {React.ReactNode} leftPanel — лівий контент (70%)
 * @param {React.ReactNode} rightPanel — правий контент (30%)
 */
export default function SessionLayout({ topBar, leftPanel, rightPanel }) {
  return (
    <AppLayout
      topBar={topBar}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
    />
  );
}
