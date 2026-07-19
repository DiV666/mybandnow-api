#!/usr/bin/env node

import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const instruments = [
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000001',
    name: 'Guitarra',
    description: 'Instrumento de cuerda versátil usado en rock, pop, flamenco, blues y muchos otros estilos.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000002',
    name: 'Guitarra eléctrica',
    description: 'Guitarra amplificada pensada para arreglos modernos, líneas solistas y bases rítmicas.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000003',
    name: 'Guitarra acústica',
    description: 'Guitarra de caja habitual en formatos de cantautor, folk y arreglos desenchufados.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000004',
    name: 'Bajo',
    description: 'Instrumento de cuerda de registro grave que aporta groove, base armónica y apoyo rítmico.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000005',
    name: 'Batería',
    description: 'Conjunto de percusión que marca el pulso, la dinámica y la identidad rítmica de una banda.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000006',
    name: 'Piano',
    description: 'Instrumento de teclado usado para armonía, melodía, acompañamiento y trabajo de arreglos.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000007',
    name: 'Teclado',
    description: 'Instrumento electrónico capaz de reproducir pianos, pads, órganos y texturas de sintetizador.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000008',
    name: 'Sintetizador',
    description: 'Instrumento electrónico usado para crear leads, bajos, pads y efectos sintéticos.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000009',
    name: 'Violín',
    description: 'Instrumento de cuerda frotada muy usado en música clásica, folk, cinematográfica y crossover.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000010',
    name: 'Violonchelo',
    description: 'Instrumento de cuerda frotada de sonido profundo y expresivo, útil para sostén melódico y armónico.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000011',
    name: 'Saxofón',
    description: 'Instrumento de viento-madera conocido por sus solos expresivos en jazz, pop, funk y soul.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000012',
    name: 'Trompeta',
    description: 'Instrumento de metal brillante usado con frecuencia para fanfarrias, melodías y acentos potentes.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000013',
    name: 'Trombón',
    description: 'Instrumento de metal con vara, frecuente en ensembles de jazz, bandas y orquestas.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000014',
    name: 'Flauta',
    description: 'Instrumento de viento-madera de timbre brillante, ideal para pasajes ágiles y texturas aéreas.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000015',
    name: 'Clarinete',
    description: 'Instrumento de viento-madera de timbre cálido usado en música clásica, jazz y contemporánea.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000016',
    name: 'Ukelele',
    description: 'Instrumento pequeño de cuerda pulsada con un tono ligero y alegre, común en pop y acústicos.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000017',
    name: 'Banjo',
    description: 'Instrumento de cuerda pulsada con ataque brillante, habitual en folk, bluegrass y country.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000018',
    name: 'Armónica',
    description: 'Instrumento compacto de lengüetas libres usado en blues, folk, rock y formatos acústicos.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000019',
    name: 'Percusión',
    description: 'Categoría amplia de instrumentos rítmicos como congas, bongós, shakers y panderetas.'
  },
  {
    id: '0e7a0d5f-3d2a-4bc1-8d4d-100000000020',
    name: 'Voz',
    description: 'La voz humana usada como instrumento principal o de apoyo en prácticamente cualquier estilo musical.'
  }
];

const dryRun = process.argv.includes('--dry-run');

async function main() {
  if (dryRun) {
    console.log(`Dry run: ${instruments.length} instruments ready to upsert.`);
    console.table(instruments.map(({ id, name }) => ({ id, name })));
    return;
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$transaction(
      instruments.map((instrument) =>
        prisma.instruments.upsert({
          where: { id: instrument.id },
          update: {
            name: instrument.name,
            description: instrument.description
          },
          create: instrument
        })
      )
    );

    console.log(`Seed completed: ${instruments.length} instruments upserted into the Instruments table.`);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Failed to seed instruments table.');
  console.error(error);
  process.exit(1);
});
