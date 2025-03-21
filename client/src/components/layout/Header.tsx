import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, Bell, ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { useLocation } from 'wouter';

interface HeaderProps {
  title: string;
  user: {
    name: string;
    role: string;
  };
  alertCount: number;
}

const Header = ({ title, user, alertCount }: HeaderProps) => {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    setLocation('/login');
  };

  return (
    <header className="bg-white shadow-md z-10 w-full">
      <div className="flex items-center justify-between px-6 py-3 w-full">

        {/* Left Side: Logo & Title (Aligned to Sidebar) */}
        <div className="flex items-center gap-3 min-w-[250px]">
          <span className="material-icons text-primary text-3xl">location_on</span>
          <h1 className="text-xl font-bold text-primary">{title}</h1>
        </div>

        {/* Center: Search Bar */}
        <div className="flex-1 flex justify-center max-w-lg">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Input
              type="text"
              placeholder="Search vehicles or addresses..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 pr-4 py-2 rounded-lg border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full"
            />
            <Search className="absolute left-3 top-2 text-neutral-300 h-5 w-5" />
          </form>
        </div>

        {/* Right Side: Notifications & User Menu (Pushed More to Right) */}
        <div className="flex items-center gap-6 min-w-[250px] justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger className="relative p-2 rounded-full hover:bg-neutral-100 transition-colors">
              <Bell className="text-neutral-400 h-5 w-5" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-error rounded-full text-white text-xs flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {alertCount > 0 ? (
                <>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation('/alerts')}>
                    You have {alertCount} unread notifications
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-primary justify-center" onClick={() => setLocation('/alerts')}>
                    View All Notifications
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem>No new notifications</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 p-2 rounded-lg hover:bg-neutral-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                {user.name.charAt(0)}
              </div>
              <span className="text-sm font-medium">{user.name}</span>
              <ChevronDown className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation('/profile')}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onClick={() => setLocation('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    </header>
  );
};

export default Header;

