# Integración de Formik y Yup - Gym Now

## 📋 Resumen de la Implementación

Se ha implementado Formik y Yup para hacer la validación del formulario de crear cliente más robusta y mantenible, reemplazando la validación manual anterior.

## ✅ Dependencias Instaladas

```bash
bun add formik yup
```

## 🔧 **Esquema de Validación con Yup**

### Validaciones Básicas
```typescript
const ClientValidationSchema = Yup.object().shape({
  // Información personal
  name: Yup.string()
    .trim()
    .required('El nombre es requerido')
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  
  email: Yup.string()
    .trim()
    .required('El email es requerido')
    .email('El email no es válido')
    .max(255, 'El email no puede exceder 255 caracteres'),
  
  phone: Yup.string()
    .trim()
    .required('El teléfono es requerido')
    .matches(/^[\+]?[0-9\s\-\(\)]+$/, 'El teléfono no es válido'),
  
  age: Yup.number()
    .required('La edad es requerida')
    .min(13, 'La edad debe ser al menos 13 años')
    .max(100, 'La edad no puede exceder 100 años')
    .typeError('La edad debe ser un número'),
  
  weight: Yup.number()
    .required('El peso es requerido')
    .min(20, 'El peso debe ser al menos 20 kg')
    .max(300, 'El peso no puede exceder 300 kg')
    .typeError('El peso debe ser un número'),
  
  height: Yup.number()
    .required('La altura es requerida')
    .min(100, 'La altura debe ser al menos 100 cm')
    .max(250, 'La altura no puede exceder 250 cm')
    .typeError('La altura debe ser un número'),
})
```

### Validaciones de Suscripción
```typescript
subscriptionType: Yup.string()
  .oneOf(['standard', 'premium', 'personalized'], 'Tipo de suscripción inválido')
  .required('Debe seleccionar un tipo de suscripción'),

startDate: Yup.date()
  .required('La fecha de inicio es requerida')
  .min(new Date(), 'La fecha de inicio no puede ser anterior a hoy'),

endDate: Yup.date()
  .required('La fecha de fin es requerida')
  .min(Yup.ref('startDate'), 'La fecha de fin debe ser posterior a la fecha de inicio'),
```

### Validaciones de Arrays y Objetos
```typescript
// Objetivos
goals: Yup.array()
  .of(Yup.string())
  .min(1, 'Debe seleccionar al menos un objetivo')
  .required('Debe seleccionar al menos un objetivo'),

// Rutinas
selectedRoutines: Yup.array()
  .of(Yup.number())
  .min(1, 'Debe seleccionar al menos una rutina')
  .required('Debe seleccionar al menos una rutina'),

// Medidas corporales
measurements: Yup.object().shape({
  chest: Yup.number()
    .min(0, 'La medida del pecho no puede ser negativa')
    .max(200, 'La medida del pecho no puede exceder 200 cm')
    .typeError('La medida del pecho debe ser un número'),
  // ... más medidas
}),
```

## 🎯 **Valores Iniciales del Formulario**

```typescript
const initialValues = {
  // Información personal
  name: '',
  email: '',
  phone: '',
  age: '',
  weight: '',
  height: '',
  goals: [] as string[],
  
  // Suscripción
  subscriptionType: 'standard',
  startDate: '',
  endDate: '',
  
  // Información adicional
  notes: '',
  emergencyContact: '',
  medicalConditions: '',
  
  // Medidas antropométricas
  bodyFat: '',
  muscleMass: '',
  
  // Medidas corporales
  measurements: {
    chest: '',
    waist: '',
    biceps: '',
    forearms: '',
    thighs: '',
    calves: '',
    neck: '',
    shoulders: '',
    hips: ''
  },
  
  // Rutinas
  selectedRoutines: [] as number[],
}
```

## 🔄 **Implementación con Formik**

### Estructura del Componente
```tsx
<Formik
  initialValues={initialValues}
  validationSchema={ClientValidationSchema}
  onSubmit={handleSubmit}
>
  {({ values, errors, touched, handleChange, handleBlur, setFieldValue, isSubmitting, isValid }) => (
    <Form>
      {/* Contenido del formulario */}
    </Form>
  )}
</Formik>
```

### Campos de Entrada
```tsx
<Field
  as={Input}
  name="name"
  placeholder="Ej: María González"
  className={errors.name && touched.name ? 'border-red-500' : ''}
/>
<ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1 flex items-center">
  {(msg) => (
    <>
      <AlertCircle className="w-3 h-3 mr-1" />
      {msg}
    </>
  )}
</ErrorMessage>
```

### Manejo de Arrays (Objetivos)
```tsx
{availableGoals.map((goal) => (
  <Button
    key={goal}
    type="button"
    size="sm"
    variant={values.goals.includes(goal) ? 'default' : 'outline'}
    onClick={() => {
      const currentGoals = values.goals
      const updatedGoals = currentGoals.includes(goal)
        ? currentGoals.filter(g => g !== goal)
        : [...currentGoals, goal]
      setFieldValue('goals', updatedGoals)
    }}
    className="justify-start"
  >
    {goal}
  </Button>
))}
```

### Manejo de Objetos Anidados (Medidas)
```tsx
<Field
  as={Input}
  type="number"
  name="measurements.chest"
  placeholder="85"
  className={errors.measurements?.chest && touched.measurements?.chest ? 'border-red-500' : ''}
/>
<ErrorMessage name="measurements.chest" component="div" className="text-red-500 text-xs mt-1 flex items-center">
  {(msg) => (
    <>
      <AlertCircle className="w-3 h-3 mr-1" />
      {msg}
    </>
  )}
</ErrorMessage>
```

## 🎣 **Función de Envío**

```typescript
const handleSubmit = async (values: any, { setSubmitting, setFieldError }: any) => {
  setIsSubmitting(true)

  try {
    // Preparar datos del cliente
    const clientData = {
      name: values.name.trim(),
      email: values.email.trim(),
      phone: values.phone.trim(),
      age: parseInt(values.age),
      weight: parseFloat(values.weight),
      height: parseFloat(values.height),
      goals: values.goals,
      join_date: new Date().toISOString().split('T')[0],
      subscription_type: values.subscriptionType,
      subscription_start: values.startDate,
      subscription_end: values.endDate,
      notes: values.notes.trim() || undefined,
      emergency_contact: values.emergencyContact.trim() || undefined,
      medical_conditions: values.medicalConditions.trim() || undefined
    }

    // Crear cliente
    const newClient = await createClient(clientData)
    
    if (newClient) {
      // Crear métricas de progreso iniciales
      const progressData = {
        client_id: newClient.id,
        date: new Date().toISOString().split('T')[0],
        weight: parseFloat(values.weight),
        body_fat: values.bodyFat ? parseFloat(values.bodyFat) : undefined,
        muscle_mass: values.muscleMass ? parseFloat(values.muscleMass) : undefined,
        measurements: Object.fromEntries(
          Object.entries(values.measurements)
            .filter(([_, value]) => value !== '')
            .map(([key, value]) => [key, parseFloat(value) || 0])
        )
      }

      await createProgressMetrics(progressData)

      // Asignar rutinas al cliente
      for (const routineId of values.selectedRoutines) {
        await createClientRoutine({
          client_id: newClient.id,
          routine_id: routineId,
          start_date: new Date().toISOString().split('T')[0],
          is_active: true,
          assigned_days: {}
        })
      }

      onSave(newClient)
      handleClose()
    }
  } catch (error) {
    console.error('Error al crear cliente:', error)
    setFieldError('submit', 'Error al crear el cliente. Intente nuevamente.')
  } finally {
    setIsSubmitting(false)
    setSubmitting(false)
  }
}
```

## 🎨 **Mejoras en la UI**

### Estados de Validación
- **Campos tocados**: Solo muestran errores después de ser tocados
- **Validación en tiempo real**: Los errores aparecen mientras el usuario escribe
- **Estados visuales**: Bordes rojos para campos con error
- **Mensajes contextuales**: Errores específicos para cada campo

### Indicadores Visuales
```tsx
// Campo con error
className={errors.name && touched.name ? 'border-red-500' : ''}

// Mensaje de error
<ErrorMessage name="name" component="div" className="text-red-500 text-xs mt-1 flex items-center">
  {(msg) => (
    <>
      <AlertCircle className="w-3 h-3 mr-1" />
      {msg}
    </>
  )}
</ErrorMessage>
```

### Estados de Carga
```tsx
{isSubmitting ? (
  <>
    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
    Creando...
  </>
) : (
  <>
    <User className="w-4 h-4 mr-2" />
    Crear Cliente
  </>
)}
```

## 📊 **Ventajas de Formik + Yup**

### ✅ **Beneficios de Formik**
- **Gestión de estado**: Manejo automático del estado del formulario
- **Validación integrada**: Validación en tiempo real y al envío
- **Manejo de errores**: Sistema robusto de manejo de errores
- **Performance**: Optimizado para formularios complejos
- **Accesibilidad**: Mejor soporte para lectores de pantalla

### ✅ **Beneficios de Yup**
- **Validaciones declarativas**: Esquemas de validación claros y legibles
- **Validaciones complejas**: Soporte para validaciones condicionales
- **Mensajes personalizados**: Mensajes de error específicos
- **Transformaciones**: Conversión automática de tipos
- **Reutilización**: Esquemas reutilizables en múltiples formularios

### ✅ **Validaciones Implementadas**

#### Validaciones de Tipo
- **Strings**: Longitud mínima y máxima, formato de email, regex para teléfono
- **Numbers**: Rango mínimo y máximo, conversión de tipos
- **Dates**: Fechas válidas, relaciones entre fechas
- **Arrays**: Longitud mínima, tipos de elementos
- **Objects**: Validación de propiedades anidadas

#### Validaciones de Negocio
- **Edad**: Entre 13 y 100 años
- **Peso**: Entre 20 y 300 kg
- **Altura**: Entre 100 y 250 cm
- **Fechas**: Fecha de fin posterior a fecha de inicio
- **Objetivos**: Al menos uno seleccionado
- **Rutinas**: Al menos una seleccionada

## 🚀 **Próximos Pasos**

### Mejoras Sugeridas
1. **Validación condicional**: Validar campos solo cuando otros están completos
2. **Validación asíncrona**: Verificar emails duplicados en tiempo real
3. **Transformaciones**: Convertir automáticamente formatos de fecha
4. **Validación de archivos**: Para futuras funcionalidades de upload
5. **Validación de dependencias**: Validar campos basados en otros valores

### Optimizaciones
1. **Debounce**: Para validaciones que requieren API calls
2. **Memoización**: Para esquemas de validación complejos
3. **Lazy validation**: Validar solo campos visibles
4. **Batch updates**: Agrupar actualizaciones de estado

### Testing
1. **Unit tests**: Para esquemas de validación
2. **Integration tests**: Para flujo completo del formulario
3. **E2E tests**: Para experiencia de usuario
4. **Error scenarios**: Probar casos de error específicos

## 🔍 **Debugging**

### Verificar Estado del Formulario
```typescript
// En la consola del navegador
console.log('Form Values:', values)
console.log('Form Errors:', errors)
console.log('Touched Fields:', touched)
console.log('Is Valid:', isValid)
console.log('Is Submitting:', isSubmitting)
```

### Verificar Validaciones
```typescript
// Probar esquema de validación
const isValid = await ClientValidationSchema.validate(values)
console.log('Validation Result:', isValid)
```

### Errores Comunes
- **Campos no validados**: Verificar que el campo esté en el esquema
- **Errores no mostrados**: Verificar que `touched` esté configurado
- **Validación no ejecutada**: Verificar que `validationSchema` esté asignado
- **Transformaciones fallidas**: Verificar tipos de datos en `initialValues`

## 📚 **Referencias**

- **Formik Documentation**: https://formik.org/
- **Yup Documentation**: https://github.com/jquense/yup
- **React Hook Form**: Alternativa a Formik
- **Zod**: Alternativa a Yup para TypeScript
- **Validación de Formularios**: Mejores prácticas en React 