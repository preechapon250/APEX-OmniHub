import { Outlet } from 'react-router-dom';

export function OmniLayout() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex">
      <aside className="w-64 border-r border-gray-800 p-6">
        <h1 className="text-xl font-bold mb-6">APEX OmniHub</h1>
        <nav className="space-y-2">
          <div className="text-gray-400">Dashboard</div>
          <div className="text-gray-400">Man Mode</div>
        </nav>
      </aside>
      <main className="flex-1 p-8">
        <Outlet />
      </main>
    </div>
  );
}
