import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Database, Trash2, RefreshCw, AlertTriangle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const TABLES = [
  { value: 'solicitudes_recoleccion', label: 'Solicitudes de Recolección', idField: 'id', displayFields: ['status', 'direccion_recoleccion', 'fecha_preferida', 'created_at'] },
  { value: 'ofertas_recoleccion', label: 'Ofertas de Recolección', idField: 'id', displayFields: ['status', 'precio_propuesto', 'fecha_disponible', 'created_at'] },
  { value: 'solicitud_residuos', label: 'Residuos de Solicitudes', idField: 'id', displayFields: ['solicitud_id', 'residuo_id', 'cantidad_real', 'created_at'] },
  { value: 'certificados', label: 'Certificados', idField: 'id', displayFields: ['numero_certificado', 'generadora_razon_social', 'recolectora_razon_social', 'fecha_recoleccion'] },
  { value: 'residuos', label: 'Residuos', idField: 'id', displayFields: ['nombre', 'categoria', 'cantidad_estimada', 'activo'] },
  { value: 'profiles', label: 'Perfiles', idField: 'id', displayFields: ['razon_social', 'nit', 'ciudad', 'email_corporativo'] },
] as const;

type TableName = typeof TABLES[number]['value'];

export default function AdminDatos() {
  const queryClient = useQueryClient();
  const [selectedTable, setSelectedTable] = useState<TableName>('solicitudes_recoleccion');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const tableConfig = TABLES.find(t => t.value === selectedTable)!;

  const { data: rows = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-datos', selectedTable],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(selectedTable)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data as Record<string, any>[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) throw new Error('No hay registros seleccionados');

      // For solicitudes, delete dependents first
      if (selectedTable === 'solicitudes_recoleccion') {
        await supabase.from('certificados').delete().in('solicitud_id', ids);
        await supabase.from('ofertas_recoleccion').delete().in('solicitud_id', ids);
        await supabase.from('solicitud_residuos').delete().in('solicitud_id', ids);
      }

      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${selectedIds.size} registro(s) eliminado(s) correctamente`);
      setSelectedIds(new Set());
      setConfirmDelete(false);
      queryClient.invalidateQueries({ queryKey: ['admin-datos', selectedTable] });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      if (selectedTable === 'solicitudes_recoleccion') {
        const allIds = rows.map(r => r.id);
        await supabase.from('certificados').delete().in('solicitud_id', allIds);
        await supabase.from('ofertas_recoleccion').delete().in('solicitud_id', allIds);
        await supabase.from('solicitud_residuos').delete().in('solicitud_id', allIds);
      }
      // Delete all visible rows
      const { error } = await supabase
        .from(selectedTable)
        .delete()
        .in('id', rows.map(r => r.id));
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Todos los registros de "${tableConfig.label}" eliminados`);
      setSelectedIds(new Set());
      setConfirmDelete(false);
      queryClient.invalidateQueries({ queryKey: ['admin-datos', selectedTable] });
    },
    onError: (err: any) => toast.error(`Error: ${err.message}`),
  });

  const toggleId = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredRows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRows.map(r => r.id)));
    }
  };

  const filteredRows = rows.filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return Object.values(row).some(v => String(v ?? '').toLowerCase().includes(term));
  });

  const formatCell = (value: any) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
      try { return format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es }); } catch { return value; }
    }
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      try { return format(new Date(value + 'T00:00:00'), "dd/MM/yyyy", { locale: es }); } catch { return value; }
    }
    if (typeof value === 'number') return value.toLocaleString('es-CO');
    return String(value).length > 40 ? String(value).substring(0, 40) + '…' : String(value);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold flex items-center gap-2">
          <Database className="h-6 w-6" /> Gestión de Datos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Consulta y elimina registros de las tablas de la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedTable} onValueChange={(v) => { setSelectedTable(v as TableName); setSelectedIds(new Set()); setSearchTerm(''); }}>
              <SelectTrigger className="w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TABLES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en registros..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" /> Recargar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-sm">
              <Badge variant="secondary">{filteredRows.length} registros</Badge>
              {selectedIds.size > 0 && (
                <Badge variant="destructive">{selectedIds.size} seleccionado(s)</Badge>
              )}
            </div>
            <div className="flex gap-2">
              {selectedIds.size > 0 && (
                <Button variant="destructive" size="sm" className="gap-1.5" onClick={() => setConfirmDelete(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> Eliminar seleccionados
                </Button>
              )}
              {filteredRows.length > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { setSelectedIds(new Set(rows.map(r => r.id))); setConfirmDelete(true); }}>
                  <Trash2 className="h-3.5 w-3.5" /> Vaciar tabla
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Database className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No hay registros en esta tabla.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === filteredRows.length && filteredRows.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead className="text-xs">ID</TableHead>
                    {tableConfig.displayFields.map(f => (
                      <TableHead key={f} className="text-xs capitalize">{f.replace(/_/g, ' ')}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map(row => (
                    <TableRow key={row.id} className={selectedIds.has(row.id) ? 'bg-destructive/5' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(row.id)}
                          onCheckedChange={() => toggleId(row.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {row.id.substring(0, 8)}…
                      </TableCell>
                      {tableConfig.displayFields.map(f => (
                        <TableCell key={f} className="text-sm">
                          {f === 'status' ? (
                            <Badge variant="outline" className="text-xs">{row[f]}</Badge>
                          ) : f === 'activo' ? (
                            <Badge variant={row[f] ? 'default' : 'secondary'} className="text-xs">{row[f] ? 'Activo' : 'Inactivo'}</Badge>
                          ) : (
                            formatCell(row[f])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Confirmar eliminación
            </DialogTitle>
            <DialogDescription>
              Estás a punto de eliminar <strong>{selectedIds.size}</strong> registro(s) de la tabla <strong>{tableConfig.label}</strong>.
              {selectedTable === 'solicitudes_recoleccion' && (
                <span className="block mt-2 text-destructive font-medium">
                  ⚠️ Esto también eliminará las ofertas, residuos asociados y certificados vinculados.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <p className="text-sm text-muted-foreground">Esta acción es irreversible. ¿Deseas continuar?</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              className="gap-1.5"
              onClick={() => {
                if (selectedIds.size === rows.length) {
                  deleteAllMutation.mutate();
                } else {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending || deleteAllMutation.isPending}
            >
              <Trash2 className="h-4 w-4" /> Eliminar definitivamente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}