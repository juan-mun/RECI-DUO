## Plan de implementación — RECI-DUO Módulos 1 y 2

### Fase 1: Base de datos y backend
1. **Crear tablas**: `registration_requests`, `registration_documents`, `request_actions_log`, `user_roles`
2. **Crear bucket de storage** `registration-documents` para los archivos subidos
3. **Configurar RLS** para cada tabla según rol
4. **Crear usuario admin hardcodeado** (andres.moreno04@usa.edu.co / 123456789)

### Fase 2: Módulo Login/Register (rutas React)
5. **Página `/auth`** con tabs Login / Register animados
   - Login: email, contraseña (toggle mostrar/ocultar), "Olvidaste tu contraseña", link a registro
   - Register: selección de rol con 3 tarjetas (Admin con pin, Generadora, Recolectora)
6. **Formulario de registro** (2 columnas desktop, 1 mobile)
   - Campos: razón social, NIT (máscara XXX.XXX.XXX-X), representante, correo, teléfono, ciudad (dropdown Colombia), contraseña, confirmar contraseña
   - Sección de carga de documentos (drag & drop) diferenciada por rol
   - Checkbox términos + botón enviar
7. **Pantalla de confirmación** post-envío con animación de check verde

### Fase 3: Módulo Admin Panel
8. **Layout admin** (`/admin`) con sidebar colapsable (Dashboard, Solicitudes, Empresas generadoras/recolectoras, Certificados, Config)
9. **Página `/admin/solicitudes`** — tabla con filtros (tabs estado, rol, buscador, orden)
   - Columnas: #, Empresa, NIT, Rol, Fecha, Documentos (indicador visual), Estado (badge), Acciones
   - 3 solicitudes de ejemplo precargadas
10. **Drawer de detalle** — datos empresa, documentos con acciones (ver/descargar/validar), verificación de licencia (simulada), decisión final (aprobar/rechazar/solicitar corrección) con modales de confirmación
11. **Timeline de historial** de acciones al pie del detalle

### Fase 4: Protección de rutas y flujos
12. **Auth guard** para rutas admin (solo rol administrador)
13. **Redirección post-login** según rol

### Notas
- Se respetará la paleta de colores RECI-DUO (verdes, ámbar, índigo para admin)
- Tipografía Barlow / Barlow Condensed
- Todo responsive mobile-first
- Validación en tiempo real en todos los formularios
