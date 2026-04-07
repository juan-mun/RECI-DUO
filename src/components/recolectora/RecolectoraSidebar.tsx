import { Home, FileText, CalendarDays, Award, FolderOpen, BarChart3, Settings, Truck, Store } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
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

export function RecolectoraSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  const { data: solicitudesCount = 0 } = useQuery({
    queryKey: ['solicitudes-disponibles-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('solicitudes_recoleccion')
        .select('id', { count: 'exact', head: true })
        .in('status', ['publicada', 'con_ofertas']);
      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
  });

  const items = [
    { title: 'Dashboard', url: '/recolectora', icon: Home, badge: null },
    { title: 'Marketplace', url: '/recolectora/marketplace', icon: Store, badge: solicitudesCount > 0 ? solicitudesCount : null },
    { title: 'Mis Ofertas', url: '/recolectora/ofertas', icon: Send, badge: null },
    { title: 'Agenda', url: '/recolectora/agenda', icon: CalendarDays, badge: null },
    { title: 'Certificados Emitidos', url: '/recolectora/certificados', icon: Award, badge: null },
    { title: 'Mis Documentos', url: '/recolectora/documentos', icon: FolderOpen, badge: null },
    { title: 'Reportes', url: '/recolectora/reportes', icon: BarChart3, badge: null },
    { title: 'Configuración', url: '/recolectora/configuracion', icon: Settings, badge: null },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 border-b border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-500">
              <Truck className="h-4 w-4 text-white" />
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
                      {!collapsed && (
                        <span className="flex-1 flex items-center justify-between">
                          <span>{item.title}</span>
                          {item.badge !== null && (
                            <Badge variant="secondary" className="ml-auto text-xs h-5 min-w-5 flex items-center justify-center">
                              {item.badge}
                            </Badge>
                          )}
                        </span>
                      )}
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
