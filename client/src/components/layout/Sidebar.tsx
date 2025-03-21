import { Link, useLocation } from 'wouter';

interface SidebarProps {
  activeItem: string;
  alertCount: number;
}

const Sidebar = ({ activeItem, alertCount }: SidebarProps) => {
  const [, setLocation] = useLocation();
  
  // Navigation items
  const navItems = [
    { id: 'dashboard', name: 'Dashboard', icon: 'dashboard', link: '/' },
    { id: 'live-tracking', name: 'Live Tracking', icon: 'location_on', link: '/live-tracking' },
    { id: 'vehicles', name: 'Vehicles', icon: 'directions_car', link: '/vehicles' },
    { id: 'geofences', name: 'Geofences', icon: 'fence', link: '/geofences' },
    { id: 'reports', name: 'Reports', icon: 'insert_chart', link: '/reports' },
    { id: 'alerts', name: 'Alerts', icon: 'notifications_active', link: '/alerts', count: alertCount },
    { id: 'settings', name: 'Settings', icon: 'settings', link: '/settings' },
    { id: 'help', name: 'Help', icon: 'help', link: '/help' },
  ];
  
  return (
    <aside className="bg-white shadow-md w-56 flex-shrink-0 flex flex-col h-full overflow-hidden custom-scrollbar">
      <nav className="flex-1 p-3 space-y-2">
        {navItems.map((item) => (
          <Link key={item.id} href={item.link}>
            <a
              className={`flex items-center gap-3 p-3 mb-1 rounded-lg transition-all duration-200
                ${activeItem === item.id 
                  ? 'bg-gray-200 text-gray-900' // Lighten active item background
                  : 'hover:bg-neutral-100 text-neutral-600'}`}
            >
              <span className="material-icons">{item.icon}</span>
              <span className="font-medium">{item.name}</span>
              {item.count && item.count > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {item.count}
                </span>
              )}
            </a>
          </Link>
        ))}
      </nav>
      
      <div className="p-4 border-t border-neutral-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="text-xs text-neutral-500">System Status: Online</span>
        </div>
        <div className="text-xs text-neutral-400">v1.0.0 • Last update: 10m ago</div>
      </div>
    </aside>
  );
};

export default Sidebar;

