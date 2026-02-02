import { Outlet } from 'react-router-dom';
import { Navigation } from '../components/Navigation';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <Navigation />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
}
