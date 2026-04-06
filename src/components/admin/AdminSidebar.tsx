import { useEffect, useState } from 'react';
import { Home, FileText, AlertTriangle, Factory, Truck, ClipboardList, Award, CalendarCheck, BarChart3, Settings, Database } from 'lucide-react';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const [pendientes, setPendientes] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    async function fetchCounts() {
      // Pending registration requests
      const { count: pendCount } = await supabase
        .from('registration_requests')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pendiente', 'en_revision']);
      setPendientes(pendCount || 0);

      // Alerts: count docs with expiration issues
      const { data: docs } = await supabase
        .from('registration_documents')
        .select('fecha_vencimiento, validation_status')
        .not('fecha_vencimiento', 'is', null);

      let alerts = 0;
      const today = new Date();
      docs?.forEach(d => {
        if (!d.fecha_vencimiento) return;
        const diff = Math.ceil((new Date(d.fecha_vencimiento).getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diff <= 30) alerts++;
      });

      // Also count pending doc validations
      const { count: pendDocs } = await supabase
        .from('registration_documents')
        .select('*', { count: 'exact', head: true })
        .eq('validation_status', 'pendiente');
      alerts += pendDocs || 0;

      setAlertCount(alerts);
    }
    fetchCounts();
  }, []);

  const sections = [
    {
      label: 'Administración',
      items: [
        { title: 'Dashboard', url: '/admin', icon: Home },
        { title: 'Solicitudes de registro', url: '/admin/solicitudes', icon: FileText, badge: pendientes, badgeColor: 'bg-destructive text-destructive-foreground' },
        { title: 'Alertas activas', url: '/admin/alertas', icon: AlertTriangle, badge: alertCount, badgeColor: 'bg-amber-500 text-white' },
      ],
    },
    {
      label: 'Empresas',
      items: [
        { title: 'Generadoras', url: '/admin/generadoras', icon: Factory },
        { title: 'Recolectoras', url: '/admin/recolectoras', icon: Truck },
      ],
    },
    {
      label: 'Operaciones',
      items: [
        { title: 'Todas las solicitudes', url: '/admin/todas-solicitudes', icon: ClipboardList },
        { title: 'Todos los certificados', url: '/admin/certificados', icon: Award },
        { title: 'Todas las recolecciones', url: '/admin/recolecciones', icon: CalendarCheck },
      ],
    },
    {
      label: 'Plataforma',
      items: [
        { title: 'Reportes y métricas', url: '/admin/reportes', icon: BarChart3 },
        { title: 'Gestión de datos', url: '/admin/datos', icon: Database },
        { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className={`p-4 border-b border-sidebar-border ${collapsed ? 'px-2' : ''}`}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--hero-green))' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="hsl(0,0%,100%)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
                <path d="M7 12l3 3 7-7"/>
              </svg>
            </div>
            {!collapsed && <span className="font-headline text-sm font-bold" style={{ color: 'hsl(var(--hero-headline))' }}>RECI-DUO</span>}
          </div>
        </div>

        {sections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === '/admin'}
                        className="hover:bg-muted/50 flex items-center justify-between"
                        activeClassName="bg-muted text-primary font-medium"
                      >
                        <span className="flex items-center">
                          <item.icon className="mr-2 h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </span>
                        {!collapsed && 'badge' in item && (item as any).badge > 0 && (
                          <span className={`ml-auto h-5 min-w-[20px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${(item as any).badgeColor}`}>
                            {(item as any).badge}
                          </span>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
