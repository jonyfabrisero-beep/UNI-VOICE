// Comprehensive, official and verified directory of Unicentro Maracay (Avenida José Casanova Godoy, Maracay, Venezuela)
// Sourced and structured from unicentromaracay.com official portal, gastronomic boulevard, store directory, and mall services.

export interface CommercialEntity {
  name: string;
  category: 'gastronomia' | 'belleza' | 'moda_calzado' | 'servicios' | 'entretenimiento' | 'salud_farmacia' | 'tecnologia' | 'hogar';
  location: string;
  floor: string;
  description: string;
  keywords: string[];
  contact?: string;
  hours?: string;
}

export const UNICENTRO_MARACAY_DIRECTORY: CommercialEntity[] = [
  // --- GASTRONOMÍA & BULEVAR ---
  {
    name: 'Pollos Gran Combo',
    category: 'gastronomia',
    location: 'Bulevar gastronómico, al lado de la entrada al área climatizada',
    floor: 'Planta Baja / Bulevar',
    description: 'Pollo crispy, pollo asado, combos familiares como Mega Sonrisa ($19.99 con 6 piezas, arepitas y papas) y hamburguesas Master Burguer 2026: Doppio Cheese ($6.99) con queso Kraft y cebolla caramelizada, y Monster Cheese ($9.99) con queso gouda y pan pretzel.',
    keywords: ['pollo', 'hamburguesa', 'burger', 'doppio', 'monster', 'almuerzo', 'comida', 'crispy', 'arepitas', 'mega sonrisa'],
    contact: '+58 424 306 5534 (pedidos por WhatsApp)',
    hours: '10:00 AM a 10:00 PM todos los días'
  },
  {
    name: 'Orbe Exotic Food',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Fusión de comida asiática, americana y comida callejera gourmet con cócteles y platos internacionales.',
    keywords: ['orbe', 'asiatica', 'fusion', 'cocteles', 'comida internacional', 'cena']
  },
  {
    name: 'Sushi & Cebiches',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Especialistas en comida japonesa y fusión peruana, rolls de sushi, cebiches frescos, tiraditos y tempuras.',
    keywords: ['sushi', 'cebiche', 'ceviche', 'pescado', 'japonesa', 'peruana', 'mariscos']
  },
  {
    name: 'Beato Napoletano',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Pizzería y trattoria italiana tradicional. Auténticas pizzas napolitanas a la leña, pastas artesanales y postres italianos.',
    keywords: ['pizza', 'pasta', 'italiana', 'beato', 'napoletana', 'calzone']
  },
  {
    name: 'Zeta Burger',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Hamburguesería gourmet con smash burgers, papas trufadas y salsas artesanales.',
    keywords: ['zeta', 'burger', 'hamburguesas', 'smash', 'papas']
  },
  {
    name: 'Ventus Café & Bistro',
    category: 'gastronomia',
    location: 'Bulevar gastronómico / Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Café de especialidad, frappes, pastelería fina, desayunos, hamburguesas gourmet y almuerzos ligeros.',
    keywords: ['ventus', 'cafe', 'frappe', 'desayuno', 'postre', 'merienda', 'torta']
  },
  {
    name: 'Santa Papa',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Papas fritas estilo europeo con variedad de toppings, tapeo, cerveza artesanal y sports bar con pantallas para partidos.',
    keywords: ['santa papa', 'papas', 'fries', 'sport bar', 'cerveza', 'partidos']
  },
  {
    name: 'Biella Gelato',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Gelatería artesanal italiana con helados cremosos de pistacho, avellana, chocolate oscuro y frutas naturales.',
    keywords: ['helado', 'gelato', 'heladeria', 'biella', 'postre', 'cono', 'dulce']
  },
  {
    name: 'Demaciao Pizza',
    category: 'gastronomia',
    location: 'Nivel Feria / Bulevar',
    floor: 'Planta Baja',
    description: 'Pizzas familiares, calzones y slices con masa crujiente y abundante queso.',
    keywords: ['pizza', 'demaciao', 'queso', 'rapida']
  },
  {
    name: 'Lubnan Shawarmas',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Comida árabe libanesa tradicional: shawarmas de carne y pollo, falafel, cremas (hummus, mutabal) y tabaquitos.',
    keywords: ['arabe', 'shawarma', 'libanesa', 'hummus', 'falafel', 'lubnan']
  },
  {
    name: 'Safari World Café',
    category: 'gastronomia',
    location: 'Nivel Entretenimiento',
    floor: 'Piso 1',
    description: 'Restaurante y cafetería temática familiar con menú infantil, snacks y ambiente interactivo.',
    keywords: ['safari', 'cafe', 'ninos', 'familiar', 'tematico']
  },
  {
    name: 'Elotes El Macho',
    category: 'gastronomia',
    location: 'Bulevar gastronómico',
    floor: 'Planta Baja',
    description: 'Mazorcas y esquites mexicanos con queso, mantequilla, salsas picantes y toppings especiales.',
    keywords: ['elote', 'maiz', 'esquite', 'mexicano', 'snack']
  },

  // --- BELLEZA, COSMÉTICA Y CUIDADO PERSONAL ---
  {
    name: 'Hallyu K-Beauty',
    category: 'belleza',
    location: 'Área climatizada',
    floor: 'Piso 1',
    description: 'Tienda de cosmética y cuidado de la piel coreano (K-Beauty), mascarillas, sérums, limpiadores y protectores solares virales.',
    keywords: ['k-beauty', 'coreano', 'skincare', 'piel', 'serum', 'hallyu', 'cosmetica']
  },
  {
    name: 'Glossy Beauty Studio',
    category: 'belleza',
    location: 'Nivel Comercio',
    floor: 'Piso 1',
    description: 'Salón de estilismo profesional especializado en balayage, colorimetría, maquillaje social, extensión de pestañas, diseño de cejas y manicura.',
    keywords: ['glossy', 'peluqueria', 'balayage', 'cabello', 'pestañas', 'cejas', 'maquillaje']
  },
  {
    name: 'MÏA Cosmetics',
    category: 'belleza',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Maquillaje profesional, labiales, bases, sombras, brochas y productos de belleza en tendencia.',
    keywords: ['mia', 'maquillaje', 'cosmeticos', 'labial', 'sombras']
  },
  {
    name: 'Studio 1118',
    category: 'belleza',
    location: 'Nivel Comercio',
    floor: 'Piso 1',
    description: 'Centro integral de belleza, secado, tratamientos capilares de keratina, botox capilar y micropigmentación.',
    keywords: ['studio 1118', 'keratina', 'peinado', 'corte', 'estetica']
  },
  {
    name: 'Vijones Beauty Bar',
    category: 'belleza',
    location: 'Área climatizada',
    floor: 'Piso 1',
    description: 'Bar de belleza especializado en manicure spa, pedicure, uñas acrílicas, gel esculpido y nail art.',
    keywords: ['vijones', 'unas', 'manicura', 'pedicura', 'nail art', 'acrilicas']
  },
  {
    name: 'Carolina Reveron',
    category: 'belleza',
    location: 'Nivel Servicios y Salud',
    floor: 'Piso 1',
    description: 'Atención quiropódica profesional, cuidado podológico, salud del pie y manicura clínica.',
    keywords: ['quiropedia', 'pies', 'pedicura', 'carolina reveron', 'podologia']
  },

  // --- SERVICIOS & SUPERMERCADOS ---
  {
    name: 'Forum Súper Mayorista',
    category: 'servicios',
    location: 'Entrada principal / Ala Oeste',
    floor: 'Planta Baja',
    description: 'Gran hipermercado con víveres nacionales e importados, carnicería, charcutería, panadería, licores y compras al detal y al mayor.',
    keywords: ['forum', 'supermercado', 'compras', 'mercado', 'comida', 'viveres', 'mayorista']
  },
  {
    name: 'Farmatodo',
    category: 'salud_farmacia',
    location: 'Planta Baja, acceso vehicular y peatonal',
    floor: 'Planta Baja',
    description: 'Farmacia de autoservicio 24 horas, medicamentos, artículos para bebés, cuidado personal, alimentos y servicios inyectables.',
    keywords: ['farmatodo', 'farmacia', 'medicina', 'pastillas', 'salud', 'remedios', '24 horas']
  },
  {
    name: 'Viajea',
    category: 'servicios',
    location: 'Área climatizada de servicios',
    floor: 'Piso 1',
    description: 'Agencia de viajes autorizada: pasajes aéreos nacionales e internacionales, paquetes turísticos, cruceros, traslados y seguros de viaje.',
    keywords: ['viajea', 'viajes', 'vuelos', 'boletos', 'pasajes', 'turismo', 'hoteles']
  },
  {
    name: 'Digitel',
    category: 'tecnologia',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Centro de atención al cliente Digitel: líneas eSIM, planes móviles 4G/LTE, recargas, cambio de chip y venta de equipos.',
    keywords: ['digitel', 'telefono', 'linea', 'esim', 'chip', 'saldo', 'recarga', 'movil']
  },

  // --- MODA, CALZADO Y ACCESORIOS ---
  {
    name: 'Jump & Jadu',
    category: 'moda_calzado',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Zapatos deportivos, casuales, sneakers urbanos y calzado para toda la familia de primeras marcas.',
    keywords: ['jump', 'jadu', 'zapatos', 'calzado', 'sneakers', 'deportivos']
  },
  {
    name: 'X Shoes & Invictus',
    category: 'moda_calzado',
    location: 'Nivel Comercio',
    floor: 'Piso 1',
    description: 'Calzado premium, zapatos formales, tacones, zapatillas y sandalias.',
    keywords: ['x shoes', 'invictus', 'zapatos', 'tacones', 'sandalias']
  },
  {
    name: 'ARROW',
    category: 'moda_calzado',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Boutique de ropa masculina: camisas de vestir, pantalones, trajes, corbatas y ropa casual elegante para caballeros.',
    keywords: ['arrow', 'ropa hombre', 'camisas', 'trajes', 'masculina', 'elegante']
  },
  {
    name: 'Tajma Joyas',
    category: 'moda_calzado',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Joyería fina en oro de 18k, pulseras de balines, cadenas, anillos de compromiso y orfebrería de lujo.',
    keywords: ['tajma', 'joyas', 'oro', 'anillos', 'pulseras', 'plata']
  },
  {
    name: 'Ágata Gift Store & Healthy Market',
    category: 'hogar',
    location: 'Nivel Comercio',
    floor: 'Planta Baja',
    description: 'Tienda de regalos, detalles, velas aromáticas, accesorios de decoración y alimentos saludables orgánicos.',
    keywords: ['agata', 'regalos', 'healthy', 'saludable', 'detalles']
  }
];

export const UNICENTRO_GENERAL_INFO = {
  mallName: 'Unicentro Maracay',
  type: 'Centro Comercial, Cultural y Tecnológico Inteligente',
  address: 'Avenida José Casanova Godoy, Maracay 2102, Estado Aragua, Venezuela',
  hours: 'Lunes a Domingo de 10:00 AM a 08:00 PM (Bulevar gastronómico hasta las 10:00 PM o 11:00 PM según local)',
  totalArea: 'Más de 49,750 metros cuadrados',
  totalStores: 'Más de 200 locales comerciales en 2 plantas',
  floors: ['Planta Baja (Bulevar Gastronómico, Moda, Supermercado)', 'Piso 1 (Servicios, Belleza, Entretenimiento, Cafés)'],
  amenities: [
    'Estacionamiento amplio y vigilado con cámaras y seguridad 24/7',
    'Bulevar Gastronómico al aire libre con pantallas gigantes',
    'Área climatizada con iluminación natural y ascensores panorámicos',
    'Escaleras mecánicas y rampas de acceso universal',
    'Planta eléctrica total y servicio de agua garantizado'
  ],
  events: [
    'Mcy Run: Carrera y caminata comunitaria con exposiciones deportivas',
    'Tardes musicales y transmisiones deportivas en el bulevar',
    'Exposiciones culturales y eventos temáticos de temporada'
  ],
  officialWebsite: 'https://unicentromaracay.com',
  socialMedia: {
    instagram: '@unicentromaracay',
    web: 'https://unicentromaracay.com'
  }
};

/**
 * Returns formatted knowledge text uniting PDF data with official Unicentro Maracay website intelligence
 */
export function getUnifiedKnowledgeText(customPdfText?: string): string {
  const directoryText = UNICENTRO_MARACAY_DIRECTORY.map(e => 
    `- ${e.name} (${e.category.toUpperCase()}, ${e.floor}): ${e.description}${e.contact ? ' | Contacto: ' + e.contact : ''}${e.hours ? ' | Horario: ' + e.hours : ''}`
  ).join('\n');

  return `=== INFORMACIÓN GENERAL DE UNICENTRO MARACAY (OFICIAL: unicentromaracay.com) ===
Dirección: ${UNICENTRO_GENERAL_INFO.address}
Horario General: ${UNICENTRO_GENERAL_INFO.hours}
Características: ${UNICENTRO_GENERAL_INFO.totalStores}, ${UNICENTRO_GENERAL_INFO.totalArea}, 2 pisos interconectados, bulevar gastronómico al aire libre y área interna climatizada.
Servicios y Comodidades: ${UNICENTRO_GENERAL_INFO.amenities.join(', ')}
Eventos y Actividades: ${UNICENTRO_GENERAL_INFO.events.join(', ')}

=== DIRECTORIO COMERCIAL Y GASTRONÓMICO DE LOCALES EN UNICENTRO MARACAY ===
${directoryText}

=== INFORMACIÓN ESPECÍFICA DETALLADA (DOCUMENTO / PDF CARGADO) ===
${customPdfText || 'Detalles de Pollos Gran Combo con hamburguesas Doppio Cheese ($6.99) y Monster Cheese ($9.99)'}`;
}
