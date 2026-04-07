import { Home, FileText, Recycle, BarChart3, Settings, Leaf, Award, Store } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const items = [
  { title: 'Dashboard', url: '/generadora', icon: Home },
  { title: 'Mis Residuos', url: '/generadora/residuos', icon: Recycle },
  { title: 'Marketplace', url: '/generadora/marketplace', icon: Store },
  { title: 'Solicitudes', url: '/generadora/solicitudes', icon: FileText },
  { title: 'Certificados', url: '/generadora/certificados', icon: Award },
  { title: 'Reportes', url: '/generadora/reportes', icon: BarChart3 },
  { title: 'Configuración', url: '/generadora/configuracion', icon: Settings },
];

export function GeneradoraSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 border-b border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--hero-green))' }}>
              <Leaf className="h-4 w-4 text-white" />
            </div>
            {!collapsed && <span className="font-headline text-sm font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>RECI-DUO</span>}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navegación</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
