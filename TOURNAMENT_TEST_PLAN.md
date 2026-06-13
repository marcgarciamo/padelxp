# Tournament Testing Plan - Fase 9

## Objetivo
Verificar que el flujo completo de torneos funciona correctamente:
1. Creación de torneo
2. Inscripción de equipos
3. Inicio del torneo (generación de bracket)
4. Ejecución de partidos
5. Finalización automática

---

## Test Cases

### TC1: Crear Torneo
**Pasos:**
1. Ir a `/tournaments/create`
2. Rellenar formulario:
   - Nombre: "Test Tournament 1"
   - Formato: "Eliminatoria"
   - Max Equipos: 4
   - XP Reward: 500
3. Click "Crear Torneo"

**Resultado esperado:**
- ✅ Torneo creado con status "open"
- ✅ Redirige a `/tournaments/{id}`
- ✅ Muestra formulario de inscripción
- ✅ Estado muestra "0/4 equipos"

---

### TC2: Inscribir Equipos (4 equipos = 8 jugadores)

**Requisitos previos:**
- Necesitar 8 jugadores diferentes en la BD (crear si no existen)
- Estar logueado como Player 1

**Equipo 1: Player1 + Player2**
- Search "player2" en buscador
- Select Player2
- Click "Confirmar pareja"

**Equipo 2: Player3 + Player4** (como Player3 logueado)
- Repetir proceso

**Equipo 3: Player5 + Player6** (como Player5 logueado)
- Repetir proceso

**Equipo 4: Player7 + Player8** (como Player7 logueado)
- Repetir proceso

**Resultado esperado:**
- ✅ Cada inscripción muestra toast "¡Inscritos correctamente!"
- ✅ Página actualiza contador "4/4 equipos"
- ✅ Desaparece formulario de inscripción
- ✅ Aparece botón "Iniciar Torneo" (solo para creador)
- ✅ Cada equipo listado con avatares de los 2 jugadores

---

### TC3: Iniciar Torneo & Generar Bracket

**Pasos:**
1. Logueado como creador (Player1)
2. Click botón "Iniciar Torneo"
3. Confirmar acción

**Resultado esperado:**
- ✅ Bracket generado con 4 rondas:
  - Ronda 1: 2 partidos (4 equipos → semifinales)
  - Ronda 2: 1 partido (2 ganadores → final)
  - Ronda 3: Final
- ✅ Status cambia a "in_progress"
- ✅ Aparece "Cuadro del Torneo" con scroll horizontal
- ✅ Cada partido muestra ambos equipos
- ✅ Solo creador ve botón "Reportar Resultado"
- ✅ Tournament no permite nuevas inscripciones

---

### TC4: Reportar Resultado - Ronda 1

**Setup:**
- Logueado como Player1 (creador)
- Ver brackets con 2 partidos pendientes

**Partido 1:**
1. Click "Reportar Resultado" (Equipo1 vs Equipo2)
2. Ingresar sets:
   - SET 1: 6-3
   - SET 2: 6-4
3. Click "Guardar"

**Resultado esperado:**
- ✅ Toast "Resultado guardado y bracket actualizado"
- ✅ Equipo1 marcado como ganador (verde)
- ✅ Partidos en Ronda 2 se actualizan (Equipo1 pasa a semifinal)
- ✅ Se crea un Match regular en `/matches` (venue: "Torneo: Test Tournament 1")
- ✅ Se registra en elo_history (4 registros, uno por jugador)

**Partido 2:**
1. Click "Reportar Resultado" (Equipo3 vs Equipo4)
2. Ingresar sets:
   - SET 1: 5-7
   - SET 2: 7-5
   - SET 3: 6-4
3. Click "Guardar"

**Resultado esperado:**
- ✅ Equipo3 pasa a semifinal
- ✅ Ronda 2 ahora muestra ambos semifinalistas

---

### TC5: Reportar Semifinales (Ronda 2)

**Partido Semifinal (Equipo1 vs Equipo3):**
1. Click "Reportar Resultado"
2. Ingresar sets:
   - SET 1: 6-2
   - SET 2: 6-1
3. Click "Guardar"

**Resultado esperado:**
- ✅ Equipo1 pasa a final
- ✅ Ronda Final actualizada con Equipo1 como semifinalista

---

### TC6: Reportar Final & Finalización Automática

**Final (Equipo1 vs Ganador Ronda 2):**
1. Click "Reportar Resultado"
2. Ingresar sets:
   - SET 1: 7-5
   - SET 2: 6-4
3. Click "Guardar"

**Resultado esperado:**
- ✅ Toast "Resultado guardado..."
- ✅ Status cambia automáticamente a "finished"
- ✅ Aparece banner "✨ TORNEO FINALIZADO ✨"
- ✅ BracketView muestra ganador final con 🏆
- ✅ Aparece celebración (TournamentWinnerCelebration)
- ✅ Desaparecen botones de "Reportar Resultado"

---

### TC7: Verificar XP & ELO Propagado

**Acciones:**
1. Ir a perfil de Player1 (ganador final)
2. Verificar `/profile` - gráfica ELO
3. Ir a `/rankings`

**Resultado esperado:**
- ✅ ELO de Player1 aumentó (4 partidos = 4 victorias)
- ✅ En elo_history aparecen 4 registros (uno por partido)
- ✅ Rankings actualizado con nuevos ELO
- ✅ Logros desbloqueados si aplican (racha, top 3, etc.)

---

### TC8: Verificar Listado de Torneos

**Acciones:**
1. Ir a `/tournaments`

**Resultado esperado:**
- ✅ "Test Tournament 1" NO aparece en "Eliminatorias abiertas" (status = finished)
- ✅ Debería tener sección "Torneos Completados" o similar
- ✅ Si hay liga asociada, aparece en "Ligas activas"

---

## Checklist de Bugs a Buscar

- [ ] UUID regex validación en URL
- [ ] Transacciones en `submitTournamentResult` son atómicas
- [ ] Bracket generación correcta para 4, 8, 16 equipos
- [ ] Ganador avanzado correctamente a siguiente ronda
- [ ] Final se detecta sin TBD/BYE
- [ ] XP & ELO se registran en ambas tablas (matches + elo_history)
- [ ] Creador es único que puede reportar resultados
- [ ] No se puede reportar resultado 2 veces mismo partido
- [ ] Celebración se muestra solo al final
- [ ] Avatar URL se propaga desde creación

---

## Notas Técnicas

- **Bracket Logic:** `src/lib/bracket.ts` - `generateEliminationBracket()`
- **Acciones:** `src/lib/actions/tournaments.ts`
- **Queries:** `src/lib/queries/tournaments.ts`
- **Components:** `src/components/tournaments/*`

---

## Ejecución Real Recomendada

Para máxima confiabilidad, ejecutar manualmente en Vercel con 8 usuarios reales:
1. Registrar 8 cuentas de test (o usar API para crearlas)
2. Seguir TC1-TC8 en secuencia
3. Documentar cualquier fallo con timestamp y screenshot

**Estimado de tiempo:** ~15 min por iteración completa
