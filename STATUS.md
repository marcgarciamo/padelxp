# PadelXP - Estado del Proyecto

Documento que resume el progreso actual y las tareas pendientes del desarrollo de PadelXP.

## 🚀 Estado Actual

### Autenticación & Usuarios
- [x] Configuración de Better-Auth con Drizzle Adapter.
- [x] Formulario de Registro funcional (Zod + React Hook Form).
- [x] **Creación automática de perfil de jugador** al registrarse.
- [x] Reparación de perfiles para usuarios existentes.
- [x] Middleware de protección de rutas y manejo de sesiones.

### Funcionalidades Core (Fase 3 Completada)
- [x] **Feed:** Vista principal con Hero Card, progreso de XP y partidos recientes.
- [x] **Rankings:** Leaderboard global ordenado por ELO con medallas para el Top 3.
- [x] **Historial de Partidos:** Listado detallado con badges de victoria/derrota y XP ganado.
- [x] **Registro de Partidos:** Formulario transaccional que calcula ELO y XP automáticamente.
- [x] **Perfil:** Visualización de atributos (Ataque, Defensa, etc.), estadísticas y logros.
- [x] **Lógica de Negocio:** Algoritmos de ELO (Team-based) y XP implementados.

### Base de Datos & Infraestructura
- [x] Esquema completo en PostgreSQL (Supabase) con Drizzle ORM.
- [x] **Seed de Datos:** 6 jugadores y 4 partidos de prueba generados para testing.
- [x] Layout responsive con centrado dinámico para escritorio (max-width: 480px).

---

## 📅 Tareas Pendientes (Roadmap)

### Fase 4: Polish & Social
- [ ] **Sistema de Amigos (Crew):**
  - Buscador de jugadores.
  - Envío y aceptación de solicitudes de amistad.
- [ ] **Logros (Achievements):**
  - Implementar disparadores (triggers) para logros específicos (ej: "Invicto", "Maestro de Voleas").
  - Notificaciones visuales al ganar un logro.
- [ ] **Edición de Perfil:**
  - Permitir cambiar foto/avatar, ubicación y posición preferida.
  - Ajuste manual de atributos iniciales (solo primera vez).
- [ ] **UI/UX & Temas:**
  - Refactorizar estilos inline a clases de CSS/Tailwind.
  - Soporte completo para Dark/Light Mode.
  - Animaciones de transición entre páginas.

---

## 🛠️ Notas Técnicas
- **Frontend:** Next.js 16 (Turbopack), React 19, Tailwind CSS 4.
- **Librerías Clave:** `better-auth`, `drizzle-orm`, `lucide-react`, `date-fns`, `sonner`, `canvas-confetti`.
- **Base de Datos:** PostgreSQL (Supabase).
- **Hosting:** Preparado para Vercel.
