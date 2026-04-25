# Milestone v1.6 Requirements

## 1. Auditoría
- [ ] **AUDIT-01**: User can edit existing clock-log marks and adjustments directly within the daily audit view, ensuring instantaneous UI and DB synchronization.
- [ ] **AUDIT-02**: System evaluates valid IN/OUT clock pairs appropriately without incorrectly flagging them as "baja confianza" (low confidence).
- [ ] **AUDIT-03**: System recalculates the employee's audit status (yellow warning state) in real-time immediately after the user corrects or validates a mark.

### User Experience & Quality of Life
- [x] **UX-11:** State Persistence â€“ User's active tab selection must be restored after navigating across routes.
- [x] **UX-12:** Expanded UI Persistence â€“ Specifically clicked employee detail rows inside grouped views must maintain their expanded state despite navigation or modal closures, increasing auditor agility.        
- [ ] **UX-13:** Drag & Drop Time Windows â€“ Add visual interface to manage and assign time windows to employees effectively preventing 'no-window' confidence issues.


## Future Requirements (Deferred)
- (No aplican para este milestone)

## Out of Scope
- Rediseño completo de la página de auditoría (únicamente estamos mejorando componentes existentes).

## Traceability

| REQ-ID | Description | Phase |
|--------|-------------|-------|
| AUDIT-01 | Edición de marcas en auditoría | Phase 51 |
| AUDIT-02 | Lógica eval IN/OUT normal | Phase 50 |
| AUDIT-03 | Recálculo de estatus en real-time | Phase 50 |
| UX-11 | Persistencia pestaña activa | Phase 49 |
| UX-12 | Persistencia estado expandido | Phase 49 |
| UX-13 | Gestión de ventanas de tiempo | Phase 52 |
