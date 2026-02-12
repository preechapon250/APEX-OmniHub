export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
          <div className="text-sm font-medium text-gray-400">Total Revenue</div>
          <div className="text-2xl font-bold">$45,231.89</div>
        </div>
      </div>
    </div>
  );
}
