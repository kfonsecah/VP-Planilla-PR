# TODO (Para Mañana)

**Problema:**
La inferencia de marcas automáticas (`inferLogTypeBySequence`) en el motor de importación no es eficiente.
- A veces clasifica Salidas como Entradas y viceversa.
- Marca a demasiados usuarios con "problemas" o anomalías cuando en realidad sus marcas están correctas.
- Dificulta hacer correcciones o ajustes posteriores.
- Para un sistema delicado (planillas), esta falta de precisión es inaceptable.

**Acción Requerida:**
- Revisar y rediseñar el sistema de inferencia de Entradas/Salidas en el `ClockLogsImportService`.
- Evaluar si se debe desactivar la inferencia automática y forzar a que el Excel tenga el tipo explícito, o si se puede mejorar la lógica (e.g. usando las ventanas de tiempo del `timeWindowService`).
