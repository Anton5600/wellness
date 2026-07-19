
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItemProps {
  to: string;
  icon: string;
  label: string;
  active: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, active }) => {
  const activeClass = active ? 'text-primary' : 'text-[#668863] dark:text-[#a0c09d]';
  const iconStyle = active ? { fontVariationSettings: "'FILL' 1" } : {};

  return (
    <Link to={to} className={`flex flex-col items-center gap-1 ${activeClass} transition-colors`}>
      <span className="material-symbols-outlined" style={iconStyle}>{icon}</span>
      <span className="text-[10px] font-bold">{label}</span>
    </Link>
  );
};

const BottomNavBar: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: 'home', label: 'Главная' },
    { to: '/history', icon: 'calendar_today', label: 'История' },
    { to: '/progress', icon: 'monitoring', label: 'Динамика' },
    { to: '/profile', icon: 'person', label: 'Профиль' },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-[430px] bg-white/80 backdrop-blur-xl dark:bg-background-dark/80 border-t border-gray-100 dark:border-white/10 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-20 px-4">
        {navItems.map(item => (
            <NavItem
                key={item.to}
                to={item.to}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.to || (item.to === '/profile' && location.pathname === '/profile')}
            />
        ))}
      </div>
      <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-20">
          <Link to="/quiz-intro" className="flex items-center justify-center size-14 bg-primary text-white rounded-full shadow-lg shadow-primary/30 active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-3xl">add</span>
          </Link>
      </div>
       <div className="flex justify-center pb-2">
            <div className="w-32 h-1 bg-black/20 dark:bg-white/20 rounded-full"></div>
       </div>
    </nav>
  );
};

export default BottomNavBar;
