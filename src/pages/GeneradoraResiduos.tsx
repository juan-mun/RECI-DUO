import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Power, PackageOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const CATEGORIAS = [
  'Peligroso RESPEL',
  'RCD',
  'RAEE',
  'Hospitalario',
  'Orgánico',
  'Especial',
];

const UNIDADES = ['kg', 'L', 'm³'];
const FRECUENCIAS = ['Diaria', 'Semanal', 'Mensual', 'Esporádica'];

type Residuo = {
  id: string;
  categoria: string;
  nombre: string;
  cantidad_estimada: number;
  unidad: string;
  frecuencia: string;
  descripcion: string | null;
  condiciones_almacenamiento: string | null;
  activo: boolean;
};

const emptyForm = {
  categoria: '',
  nombre: '',
  cantidad_estimada: '',
  unidad: '',
  frecuencia: '',
  descripcion: '',
  condiciones_almacenamiento: '',
};

export default function GeneradoraResiduos() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: residuos = [], isLoading } = useQuery({
    queryKey: ['residuos', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('residuos')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Residuo[];
    },
    enabled: !!user,
  });

  const upsertMutation = useMutation({
    mutationFn: async (values: typeof emptyForm & { id?: string }) => {
      const payload = {
        user_id: user!.id,
        categoria: values.categoria,
        nombre: values.nombre,
        cantidad_estimada: Number(values.cantidad_estimada),
        unidad: values.unidad,
        frecuencia: values.frecuencia,
        descripcion: values.descripcion || null,
        condiciones_almacenamiento: values.condiciones_almacenamiento || null,
      };

      if (values.id) {
        const { error } = await supabase.from('residuos').update(payload).eq('id', values.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('residuos').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast.success(editId ? 'Residuo actualizado' : 'Residuo agregado');
      closeModal();
    },
    onError: () => toast.error('Error al guardar el residuo'),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase.from('residuos').update({ activo: !activo }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al cambiar estado'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('residuos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['residuos'] });
      toast.success('Residuo eliminado');
    },
    onError: () => toast.error('Error al eliminar. Puede estar vinculado a una solicitud.'),
  });

  const closeModal = () => {
    setOpen(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const openEdit = (r: Residuo) => {
    setEditId(r.id);
    setForm({
      categoria: r.categoria,
      nombre: r.nombre,
      cantidad_estimada: String(r.cantidad_estimada),
      unidad: r.unidad,
      frecuencia: r.frecuencia,
      descripcion: r.descripcion ?? '',
      condiciones_almacenamiento: r.condiciones_almacenamiento ?? '',
    });
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoria || !form.nombre || !form.cantidad_estimada || !form.unidad || !form.frecuencia) {
      toast.error('Completa todos los campos obligatorios');
      return;
    }
    upsertMutation.mutate({ ...form, id: editId ?? undefined });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-headline text-2xl font-bold">Mis Residuos</h1>
          <p className="text-muted-foreground text-sm mt-1">Gestiona los residuos que genera tu empresa.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Agregar residuo
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Cargando...</div>
      ) : residuos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="rounded-full bg-muted p-6">
            <PackageOpen className="h-12 w-12 text-muted-foreground" />
          </div>
          <h2 className="font-headline text-xl font-semibold">No tienes residuos registrados</h2>
          <p className="text-muted-foreground max-w-md">
            Comienza registrando los tipos de residuos que genera tu empresa para poder solicitar recolecciones.
          </p>
          <Button onClick={() => setOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Agregar mi primer residuo
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoría</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Cantidad Est.</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Frecuencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residuos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Badge variant="outline">{r.categoria}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell>{r.cantidad_estimada}</TableCell>
                  <TableCell>{r.unidad}</TableCell>
                  <TableCell>{r.frecuencia}</TableCell>
                  <TableCell>
                    <Badge variant={r.activo ? 'default' : 'secondary'}>
                      {r.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(r)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => toggleMutation.mutate({ id: r.id, activo: r.activo })}
                      title={r.activo ? 'Desactivar' : 'Activar'}
                    >
                      <Power className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" title="Eliminar" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar residuo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará permanentemente "{r.nombre}". Si está vinculado a solicitudes activas, no podrá eliminarse.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(r.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal agregar/editar */}
      <Dialog open={open} onOpenChange={(v) => { if (!v) closeModal(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar residuo' : 'Agregar residuo'}</DialogTitle>
            <DialogDescription>
              {editId ? 'Modifica la información del residuo.' : 'Registra un nuevo tipo de residuo que genera tu empresa.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Categoría *</Label>
                <Select value={form.categoria} onValueChange={(v) => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Nombre del residuo *</Label>
                <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Aceite usado" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cantidad estimada *</Label>
                <Input type="number" min="0" step="0.01" value={form.cantidad_estimada} onChange={(e) => setForm({ ...form, cantidad_estimada: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Unidad *</Label>
                <Select value={form.unidad} onValueChange={(v) => setForm({ ...form, unidad: v })}>
                  <SelectTrigger><SelectValue placeholder="Unidad" /></SelectTrigger>
                  <SelectContent>
                    {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Frecuencia *</Label>
                <Select value={form.frecuencia} onValueChange={(v) => setForm({ ...form, frecuencia: v })}>
                  <SelectTrigger><SelectValue placeholder="Frecuencia" /></SelectTrigger>
                  <SelectContent>
                    {FRECUENCIAS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} placeholder="Descripción del residuo..." rows={2} />
            </div>
            <div className="space-y-2">
              <Label>Condiciones de almacenamiento</Label>
              <Textarea value={form.condiciones_almacenamiento} onChange={(e) => setForm({ ...form, condiciones_almacenamiento: e.target.value })} placeholder="Cómo se almacena actualmente..." rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>Cancelar</Button>
              <Button type="submit" disabled={upsertMutation.isPending}>
                {upsertMutation.isPending ? 'Guardando...' : editId ? 'Guardar cambios' : 'Agregar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
