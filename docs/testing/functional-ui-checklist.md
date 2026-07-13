# Checklist funcional UI

Fuente: `PPF_[PROY]_Plan_Pruebas_Funcionales.odt`.

Usar este archivo para los casos que Postman no puede validar visualmente.

| Caso | Ruta sugerida | Validacion |
| --- | --- | --- |
| CP-INV-01 | `/inventario` | Crear insumo y verificar fila en tabla |
| CP-INV-02 | `/inventario` | Registrar entrada y verificar stock/historial |
| CP-INV-03 | `/inventario` | Registrar salida valida e invalida |
| CP-INV-05 | `/inventario` | Verificar alerta visual/correo bajo umbral |
| CP-INV-06 | `/inventario` | Descargar Excel y comparar columnas/datos |
| CP-KAN-01 | `/dashboard` o tablero Kanban | Ver tarjeta creada en `PRE_PRENSA`/recibido |
| CP-KAN-02 | `/dashboard` | Mover tarjeta y refrescar para verificar persistencia |
| CP-KAN-03 | `/dashboard` en dos navegadores | Cambio en tiempo real en menos de 2 segundos |
| CP-KAN-05 | `/dashboard` | Orden vencida resaltada visualmente |
| CP-COT-01..03 | `/cotizaciones` | Calculo visible con desglose y totales |
| CP-COT-04 | `/cotizaciones` | Bloqueado si no existe accion PDF |
| CP-BI-01 | `/bi` | KPIs y filtros actualizan datos |
| CP-BI-02 | `/bi` | Bloqueado si no existe exportacion Excel/PDF |
| CP-SEC-01 | `/login` | Login exitoso y redireccion por rol |
| CP-SEC-02 | rutas protegidas | Acceso denegado sin sesion si la UI lo implementa |

## Ambiente

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8080`
- Credencial QA: `juan@prex.mx` / `contrase?a123`
