# Algoritmo de Matching — Círculos de Cuidado

## 1. Objetivo

El algoritmo de matching propone círculos de cuidado compatibles para cuidadores basándose en factores emocionales, contextuales y logísticos. El objetivo es:

- Maximizar la compatibilidad emocional entre miembros
- Garantizar viabilidad logística (ubicación, horarios)
- Crear grupos homogéneos en experiencia y fase de cuidado
- Priorizar usuarios con mayor urgencia

## 2. Factores de matching

El algoritmo evalúa 6 factores principales entre pares de cuidadores. Cada factor produce una puntuación de 0 a 1 (0 = incompatible, 1 = perfectamente compatible).

### 2.1 Enfermedad Principal (peso: 0.25)

La enfermedad del adulto mayor a cargo define contextos emocionales compartidos.

**Cálculo:**
- **Coincidencia exacta** (mismo diagnóstico o categoría): `score = 1.0`
- **Coincidencia similar** (en misma categoría: neurodegenerativa, oncológica, etc.): `score = 0.7`
- **Coincidencia parcial** (enfermedades crónicas ambas): `score = 0.4`
- **Sin coincidencia**: `score = 0.1`

**Categorías predefinidas:**
```
- Neurodegenerativa: Alzheimer, Parkinson, ELA, demencia
- Oncológica: Cáncer activo, en remisión, paliativo
- Cardiovascular: Insuficiencia cardíaca, ACV, hipertensión avanzada
- Respiratoria: EPOC, fibrosis pulmonar, insuficiencia respiratoria
- Endocrina: Diabetes avanzada, hipotiroidismo severo
- Movilidad: Parálisis, artrosis avanzada, osteoporosis
- Cognitiva: Demencia vascular, deterioro cognitivo leve
- Multimorbilidad: 3+ condiciones crónicas significativas
- Paliativos: Cuidado de fin de vida
```

### 2.2 Fase de Cuidado (peso: 0.20)

La fase define la intensidad emocional y tiempo requerido.

**Cálculo:**
```
fase_1 = "inicial"      # Diagnóstico reciente, adaptación
fase_2 = "intermedio"   # Rutina establecida, desafíos moderados
fase_3 = "avanzado"     # Dependencia total, riesgo alto
```

**Matriz de compatibilidad:**
```
        inicial   intermedio   avanzado
inicial   1.0       0.6         0.3
inter     0.6       1.0         0.6
avanza    0.3       0.6         1.0
```

Lógica: personas en la misma fase comparten desafíos similares. Fase inicial + intermedio tienen cierta compatibilidad; avanzado se agrupa mejor entre sí (mayor urgencia y recursos).

### 2.3 Edad (peso: 0.15)

La edad del cuidador influye en capacidad física y perspectiva vital.

**Cálculo:**

```
diferencia_edad = |edad_a - edad_b|

si diferencia_edad <= 5:   score = 1.0
si diferencia_edad <= 10:  score = 0.85
si diferencia_edad <= 15:  score = 0.65
si diferencia_edad <= 20:  score = 0.40
si diferencia_edad > 20:   score = 0.20
```

**Rationale:** Diferencias pequeñas de edad permiten empatía sobre cambios en la vida, energía y desafíos. Diferencias grandes (>20 años) reducen compatibilidad pero no la descartan.

### 2.4 Geografía (peso: 0.20)

Proximidad geográfica facilita sesiones y apoyo comunitario.

**Cálculo:**

```
ubicacion_a, ubicacion_b: región/ciudad (string)

si ubicacion_a == ubicacion_b:          score = 1.0
si ubicacion_a en region(ubicacion_b):  score = 0.8
si ciudad_a y ciudad_b en mismo pais:   score = 0.5
si paises_diferentes:                   score = 0.1 (requiere UTC)
```

**Nota sobre UTC:** Si dos cuidadores comparten huso horario, la puntuación geográfica puede aumentarse en +0.1 (máximo 1.0).

### 2.5 Disponibilidad Horaria (peso: 0.15)

Capacidad de asistir a sesiones semanales en horarios coincidentes.

**Datos de entrada:**
```
disponibilidad = {
  "lunes": ["09:00-12:00", "18:00-21:00"],
  "martes": ["09:00-12:00"],
  ...
}
```

**Cálculo:**

```
solapamiento_horas = suma de minutos en común en la semana

si solapamiento >= 180 minutos (3 horas/semana):  score = 1.0
si solapamiento >= 120 minutos (2 horas/semana):  score = 0.85
si solapamiento >= 60 minutos (1 hora/semana):    score = 0.65
si solapamiento >= 30 minutos:                    score = 0.40
si solapamiento < 30 minutos:                     score = 0.1
```

**Rationale:** Sesiones semanales requieren al menos 1-2 horas de solapamiento. Menos de 30 minutos hace muy difícil coordinar una sesión coherente.

### 2.6 Idioma (peso: 0.05)

Idioma compartido facilita comprensión emocional profunda.

**Cálculo:**

```
si idioma_a == idioma_b:  score = 1.0
si ambos hablan otro idioma en comun: score = 0.8
si uno habla el idioma del otro (nivel intermedio+): score = 0.5
si no hay idioma en comun: score = 0.0
```

**Nota:** Baño bajo peso (5%) porque la mayoría de plataforma será monolingüe inicialmente (español), pero se prepara para futuros circulos multilingües.

## 3. Puntuación de Compatibilidad

### 3.1 Fórmula de scoring pairwise

La puntuación de compatibilidad entre dos cuidadores A y B es:

```
score_compatibilidad(A, B) = Σ(peso_i × score_i) / Σ(pesos)

Donde:
- peso_enfermedad = 0.25
- peso_fase = 0.20
- peso_edad = 0.15
- peso_geografia = 0.20
- peso_disponibilidad = 0.15
- peso_idioma = 0.05
- Σ(pesos) = 1.0

score_compatibilidad ∈ [0, 1]
```

### 3.2 Interpretación de scores

```
[0.00 - 0.30]: Muy baja - evitar agrupar
[0.30 - 0.50]: Baja - solo si no hay alternativas
[0.50 - 0.70]: Media - compatible con reservas
[0.70 - 0.85]: Alta - buena compatibilidad
[0.85 - 1.00]: Muy alta - excelente compatibilidad
```

### 3.3 Matriz de compatibilidad pairwise

Para N cuidadores candidatos, se calcula una matriz N×N:

```
        User1   User2   User3   User4   ...
User1   -       0.76    0.52    0.88    ...
User2   0.76    -       0.68    0.64    ...
User3   0.52    0.68    -       0.45    ...
User4   0.88    0.64    0.45    -       ...
...     ...     ...     ...     ...     -
```

## 4. Algoritmo de Matching de Círculos

### 4.1 Entrada

```typescript
tipo MatchingRequest = {
  cuidadores_candidatos: Cuidador[],  // lista de perfiles
  capacidad_circulo: {
    minima: 6,
    maxima: 8
  },
  threshold_compatibilidad: 0.60,  // mínimo score para incluir
  prioridad: "urgencia" | "compatibilidad"  // estrategia
}
```

### 4.2 Salida

```typescript
tipo ResultadoMatching = {
  circulos: Circulo[],
  cola_espera: Cuidador[],
  no_asignados: Cuidador[],
  metricas: {
    promedio_compatibilidad: number,
    tasa_asignacion: number,  // % de cuidadores asignados
    tasa_urgencia_asignada: number  // % de urgentes asignados
  }
}

tipo Circulo = {
  miembros: Cuidador[],
  compatibilidad_promedio: number,
  facilitador_recomendado?: Facilitador
}
```

### 4.3 Pasos del algoritmo

**Paso 1: Normalizar y validar datos**

- Verificar que todos los cuidadores tengan perfiles completos
- Validar rangos de edad, fases, idiomas
- Normalizar ubicaciones a formato estándar (región/ciudad)
- Convertir disponibilidades a formato UTC si aplica

**Paso 2: Calcular matriz de compatibilidad**

- Para cada par (A, B) de cuidadores, calcular `score_compatibilidad(A, B)`
- Guardar en matriz simetrica N×N

**Paso 3: Aplicar criterios de filtrado** (opcional, según políticas)

- Excluir pairs con score < `threshold_compatibilidad`
- Marcar cuidadores "no asignables" si están en COLA de espera anterior
- Marcar facilitadores que no encajen con disponibilidad del círculo

**Paso 4: Seleccionar semilla inicial**

Si `prioridad == "urgencia"`:
  - Seleccionar el cuidador con mayor valor de `urgencia`
  - Iniciar círculo con este cuidador

Si `prioridad == "compatibilidad"`:
  - Encontrar la dupla (A, B) con mayor score de compatibilidad
  - Iniciar círculo con ambos

**Paso 5: Expandir círculo iterativamente**

```
Mientras (tamaño_circulo < capacidad_maxima):
  1. Calcular score promedio del cuidador candidato con respecto al círculo actual
  2. Seleccionar el candidato con mayor score promedio >= threshold
  3. Si existe, agregar al círculo
  4. Si no existe, pasar a siguiente círculo o cola de espera
```

**Paso 6: Validar y finalizar círculos**

- Verificar que cada círculo tenga entre capacidad_minima y capacidad_maxima
- Si círculo < capacidad_minima, mover miembros a cola de espera
- Calcular compatibilidad promedio del círculo (promedio de todos los pairs)

**Paso 7: Asignar facilitador** (ver sección 5)

- Para cada círculo creado, evaluar mejor facilitador
- Si no hay facilitador disponible, marcar círculo como "en revisión"

### 4.4 Pseudocódigo

```python
def matching_circulos(candidatos, capacidad, threshold, prioridad):
    matriz = calcular_matriz_compatibilidad(candidatos)
    circulos = []
    asignados = set()
    cola_espera = []
    
    while len(asignados) < len(candidatos):
        # Paso 4: Seleccionar semilla
        if prioridad == "urgencia":
            semilla = max(candidatos - asignados, key=urgencia)
        else:
            semilla = mejor_dupla(matriz, candidatos - asignados)[0]
        
        circulo = [semilla]
        asignados.add(semilla)
        
        # Paso 5: Expandir
        while len(circulo) < capacidad.maxima:
            candidatos_restantes = candidatos - asignados
            scores = {c: score_promedio_vs_circulo(c, circulo, matriz) 
                     for c in candidatos_restantes}
            
            mejor_candidato = max(scores, key=scores.get)
            if scores[mejor_candidato] >= threshold:
                circulo.append(mejor_candidato)
                asignados.add(mejor_candidato)
            else:
                break
        
        # Paso 6: Validar
        if len(circulo) >= capacidad.minima:
            circulos.append(circulo)
        else:
            cola_espera.extend(circulo)
            for c in circulo:
                asignados.remove(c)
    
    return circulos, cola_espera, candidatos - asignados
```

## 5. Matching de Facilitador

Una vez formado un círculo, se asigna un facilitador.

### 5.1 Criterios de matching de facilitador

Para cada facilitador F y círculo C:

**5.1.1 Especialidades (peso: 0.40)**

```
especialidades_circulo = {enfermedades, fases principales del círculo}

si F.especialidades ⊇ especialidades_circulo:  score = 1.0
si F.especialidades ∩ especialidades_circulo > 50%: score = 0.8
si F.especialidades ∩ especialidades_circulo > 0: score = 0.5
si no hay overlap: score = 0.0
```

**5.1.2 Disponibilidad (peso: 0.35)**

```
disponibilidad_circulo = union de disponibilidades de miembros

solapamiento_F = solapamiento entre F.disponibilidad y disponibilidad_circulo

si solapamiento >= 120 minutos: score = 1.0
si solapamiento >= 90 minutos:  score = 0.8
si solapamiento >= 60 minutos:  score = 0.6
si solapamiento < 60 minutos:   score = 0.0
```

**5.1.3 Experiencia y Calificación (peso: 0.25)**

```
si F.calificacion_promedio >= 4.5: score = 1.0
si F.calificacion_promedio >= 4.0: score = 0.85
si F.calificacion_promedio >= 3.5: score = 0.65
si F.calificacion_promedio < 3.5:  score = 0.3

Se suma un bonus de +0.1 si F.experiencia_years >= 5
```

### 5.2 Puntuación facilitador-círculo

```
score_facilitador_circulo = (0.40 × score_especialidades +
                              0.35 × score_disponibilidad +
                              0.25 × score_experiencia)

Rango: [0, 1]
```

### 5.3 Selección

- Seleccionar facilitador con mayor score >= 0.60
- Si no existe, marcar círculo como "en revisión" (asignar admin o formación)

## 6. Ejemplos de Cálculo

### 6.1 Ejemplo 1: Dos cuidadores compatibles

**Perfil A:**
- Edad: 45 años
- Enfermedad: Alzheimer
- Fase: Avanzado
- Ubicación: Madrid
- Disponibilidad: Lunes 18:00-20:00, Jueves 15:00-17:00
- Idioma: Español

**Perfil B:**
- Edad: 48 años
- Enfermedad: Demencia vascular
- Fase: Avanzado
- Ubicación: Madrid
- Disponibilidad: Martes 18:00-20:00, Jueves 14:00-16:00
- Idioma: Español

**Cálculos:**

| Factor | Cálculo | Score |
|--------|---------|-------|
| Enfermedad | Ambos neurodegenerativos, similar | 0.7 |
| Fase | Ambos avanzado | 1.0 |
| Edad | \|45-48\| = 3, ≤5 | 1.0 |
| Geografía | Mismo ciudad (Madrid) | 1.0 |
| Disponibilidad | Jueves 15:00-16:00 = 60 min | 0.65 |
| Idioma | Ambos español | 1.0 |

**Puntuación:**
```
score = (0.25×0.7 + 0.20×1.0 + 0.15×1.0 + 0.20×1.0 + 0.15×0.65 + 0.05×1.0) / 1.0
      = (0.175 + 0.20 + 0.15 + 0.20 + 0.0975 + 0.05)
      = 0.8725
      
Resultado: ALTA COMPATIBILIDAD ✓
```

### 6.2 Ejemplo 2: Cuidadores con restricción geográfica

**Perfil C:**
- Edad: 55 años
- Enfermedad: EPOC
- Fase: Intermedio
- Ubicación: Barcelona
- Disponibilidad: Miércoles 19:00-21:00
- Idioma: Español

**Perfil D:**
- Edad: 42 años
- Enfermedad: Diabetes avanzada
- Fase: Inicial
- Ubicación: Valencia
- Disponibilidad: Miércoles 19:00-21:00
- Idioma: Español

**Cálculos:**

| Factor | Cálculo | Score |
|--------|---------|-------|
| Enfermedad | Respiratoria vs Endocrina, no hay overlap | 0.1 |
| Fase | Intermedio vs Inicial | 0.6 |
| Edad | \|55-42\| = 13, ≤15 | 0.65 |
| Geografía | Diferentes ciudades, mismo país | 0.5 |
| Disponibilidad | Miércoles 19:00-21:00 = 120 min | 0.85 |
| Idioma | Ambos español | 1.0 |

**Puntuación:**
```
score = (0.25×0.1 + 0.20×0.6 + 0.15×0.65 + 0.20×0.5 + 0.15×0.85 + 0.05×1.0)
      = (0.025 + 0.12 + 0.0975 + 0.10 + 0.1275 + 0.05)
      = 0.5
      
Resultado: COMPATIBILIDAD MEDIA (puede funcionar con reservas)
```

## 7. Consideraciones Especiales

### 7.1 Urgencia

Cuidadores con valores altos de urgencia (escala 1-10) tienen prioridad:
- Si un cuidador tiene urgencia >= 8, se intenta asignar lo antes posible
- Si un círculo tiene promedio de urgencia alto (>= 7), se acelera su formación
- En cola de espera, se ordena por urgencia descendente

### 7.2 Casos extremos

**Cuidador aislado:** Si un cuidador no alcanza score >= 0.50 con ningún otro:
- Se intenta en siguiente ronda (si hay nuevas altas)
- Se coloca en cola de espera
- Se recomienda formación facilitador 1:1 (tarea 63)

**Círculo incompleto:** Si no hay suficientes candidatos:
- Se acepta círculo con capacidad_minima = 4 (en lugar de 6)
- Se notifica administrador para búsqueda activa
- Se marca como "en consolidación" por 2 semanas

**Facilitador no disponible:** Si ningún facilitador encaja:
- Se asigna facilitador con score >= 0.40 (más flexible)
- Se marca círculo para supervisión adicional
- Se activa plan de formación acelerada

### 7.3 Política de re-matching

Un cuidador puede solicitar re-matching si:
- Ha asistido a 5+ sesiones pero no se conecta (compatibilidad personal baja)
- Su situación cambió (mudanza, cambio de disponibilidad)
- Lo solicita expresamente (derecho del usuario)

Al re-matching:
- Se recalculan factores (especialmente geografía, disponibilidad)
- Se genera nuevo círculo con threshold aumentado a 0.70 (más exigente)
- Se intenta mantener facilitador igual si posible

## 8. Privacidad y Ética

### 8.1 Transparencia

- Se nunca revelan scores de compatibilidad a usuarios
- Se comunica: "Se ha encontrado un grupo compatible" (binario)
- Se permite usuarios ver el perfil anónimo de otros miembros antes de confirmar

### 8.2 Consentimiento

- Antes de incluir a un cuidador en un círculo, se pide confirmación
- Se puede rechazar círculo propuesto (vuelve a cola)
- Se permite máximo 1 rechazo antes de restricción temporal (48h)

### 8.3 Datos sensibles

- Enfermedades se categorizan en grupos (no datos individuales en tránsito)
- Ubicación exacta se redondea a ciudad/región
- Disponibilidad no incluye timezone específica (solo huso horario)

## 9. Próximos Pasos

1. **Tarea 28:** Implementar función `scoring_compatibilidad()` con tests unitarios
2. **Tarea 29:** Implementar algoritmo de generación de círculos en endpoint `POST /api/circulos/match`
3. **Tarea 30:** Implementar sistema de cola de espera con priorización
4. **Tarea 35:** Crear herramienta dev `/dev/matching` para simular matching

## 10. Referencias

- Tareas relacionadas: 28, 29, 30, 34, 35
- Documentos consultados: `DB_SCHEMA.md`, `ARQUITECTURA.md`
- Patrón: Algoritmo greedy con matriz de compatibilidad pairwise
