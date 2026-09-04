import { KnowledgeDocument } from '../types';

export const DEFAULT_DOCUMENT_CONTENT = `INFO DE TIENDAS

POLLOS GRAN COMBO:
UBICACIÓN: BULEVAR CERCA DE LA ENTRADA AL ÁREA CLIMATIZADA
HORARIO: DE 10AM A 10PM TODOS LOS DIAS
PROMOCIONES: HAMBURGUESAS DEL MASTER BURGUER 2026 UNA VERSION STANDART POR 6.99$ Y UNA VERSION PREMIUM POR 9.99$

PRESENTANDO DOS PROPUESTAS:
1. Opción Standard: Doppio Cheese ($6.99)
• Ingredientes: Pan brioche coronado con queso parmesano, pollo crispy, queso Kraft, tocineta, cebolla caramelizada y salsa de ajo parmesano.

2. Opción Premium: Monster Cheese ($9.99)
• Ingredientes: Pan pretzel, pollo crispy, queso gouda holandés, mermelada de tocineta, tira de tocineta extra, lechuga y salsa mayo ranch.

Teléfonos de contacto para pedir por whatsapp:
+584243065534

Que opciones de pollo tienen?
Tienen desde combos individuales hasta combos familiares como por ejemplo:
- El Mega Sonrisa por 19.99$ que incluye 6 piezas de pollo, 2 raciones de arepita, 2 raciones de papitas y 1 refresco de 1lt.

TIENDAS DE BELLEZA:
- Hallyu K-Beauty
- Glossy Beauty Studio
- MÏA Cosmetics
- Studio 1118
- Vijones Beauty Bar`;

export const DEFAULT_KNOWLEDGE_DOC: KnowledgeDocument = {
  id: 'doc-default-info-tiendas',
  title: 'info_tiendas_pollos_gran_combo.pdf',
  content: DEFAULT_DOCUMENT_CONTENT,
  pageCount: 1,
  uploadedAt: 'Documento PDF activo',
  isDefault: true,
};

export const QUICK_VOICE_PROMPTS = [
  "¿Cuáles son las promociones de Pollos Gran Combo?",
  "¿Qué tiendas de belleza hay disponibles?"
];
