import { PrismaClient, Platform, VehicleType } from '@prisma/client';
import { INTERNAL_CATEGORY_TREE } from '../src/constants/internal-categories';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await seedVehicleMakes();
  await seedInternalCategories();
  await seedMockCategoryMappings();

  console.log('Seed complete.');
}

async function seedVehicleMakes() {
  const cars = [
    { name: 'Alfa Romeo', models: ['147', '159', 'Giulia', 'Stelvio'] },
    { name: 'Audi', models: ['A3', 'A4', 'A6', 'A8', 'Q3', 'Q5', 'Q7'] },
    { name: 'BMW', models: ['E30', 'E46', 'E90', 'F10', 'F30', 'X3', 'X5'] },
    { name: 'Citroen', models: ['C3', 'C4', 'C5', 'Berlingo', 'Jumper'] },
    { name: 'Dacia', models: ['Duster', 'Logan', 'Sandero'] },
    { name: 'Fiat', models: ['500', 'Panda', 'Punto', 'Doblo', 'Ducato'] },
    { name: 'Ford', models: ['Focus', 'Mondeo', 'Fiesta', 'Kuga', 'Transit'] },
    { name: 'Honda', models: ['Civic', 'Accord', 'CR-V', 'Jazz'] },
    { name: 'Hyundai', models: ['i20', 'i30', 'Tucson', 'Santa Fe'] },
    { name: 'Kia', models: ['Ceed', 'Sportage', 'Sorento', 'Rio'] },
    { name: 'Mazda', models: ['2', '3', '6', 'CX-3', 'CX-5'] },
    { name: 'Mercedes-Benz', models: ['A-Klasse', 'C-Klasse', 'E-Klasse', 'S-Klasse', 'GLC', 'Sprinter'] },
    { name: 'Mitsubishi', models: ['Lancer', 'ASX', 'Outlander', 'Pajero'] },
    { name: 'Nissan', models: ['Micra', 'Qashqai', 'X-Trail', 'Navara'] },
    { name: 'Opel', models: ['Astra', 'Vectra', 'Corsa', 'Insignia', 'Zafira'] },
    { name: 'Peugeot', models: ['206', '207', '307', '308', '3008', '407', '508', 'Boxer'] },
    { name: 'Renault', models: ['Clio', 'Megane', 'Laguna', 'Kadjar', 'Kangoo', 'Master'] },
    { name: 'Seat', models: ['Ibiza', 'Leon', 'Ateca', 'Alhambra'] },
    { name: 'Skoda', models: ['Octavia', 'Fabia', 'Superb', 'Kodiaq', 'Kamiq'] },
    { name: 'Subaru', models: ['Impreza', 'Legacy', 'Forester', 'Outback'] },
    { name: 'Suzuki', models: ['Samurai', 'Swift', 'Vitara', 'Jimny', 'Ignis', 'SX4'] },
    { name: 'Toyota', models: ['Corolla', 'Avensis', 'Yaris', 'RAV4', 'Hilux'] },
    { name: 'Volkswagen', models: ['Golf', 'Passat', 'Polo', 'Tiguan', 'Touran', 'Transporter', 'Crafter'] },
    { name: 'Volvo', models: ['S40', 'S60', 'S90', 'V70', 'V90', 'XC60', 'XC90'] },
  ];

  const motorcycles = [
    { name: 'Aprilia', models: ['RS 125', 'RS 660', 'Tuono 660'] },
    { name: 'BMW', models: ['R 1250 GS', 'F 900 R', 'S 1000 RR'] },
    { name: 'Ducati', models: ['Monster', 'Panigale V4', 'Multistrada V4', 'Scrambler'] },
    { name: 'Harley-Davidson', models: ['Street 750', 'Iron 883', 'Fat Bob'] },
    { name: 'Honda', models: ['CBR600RR', 'CB500F', 'Africa Twin', 'PCX125', 'Hornet 750'] },
    { name: 'Kawasaki', models: ['Ninja 400', 'Z900', 'Versys 650', 'KLR 650'] },
    { name: 'KTM', models: ['125 Duke', '390 Duke', '790 Adventure'] },
    { name: 'Suzuki', models: ['GSX-R600', 'V-Strom 650', 'SV650', 'Hayabusa'] },
    { name: 'Triumph', models: ['Street Triple', 'Tiger 900', 'Bonneville T120'] },
    { name: 'Yamaha', models: ['MT-07', 'MT-09', 'YZF-R6', 'Tracer 900', 'XMAX'] },
  ];

  const trucks = [
    { name: 'DAF', models: ['CF', 'XF', 'LF'] },
    { name: 'Iveco', models: ['Daily', 'Eurocargo', 'Stralis', 'S-Way'] },
    { name: 'MAN', models: ['TGL', 'TGM', 'TGS', 'TGX'] },
    { name: 'Mercedes-Benz', models: ['Atego', 'Actros', 'Arocs'] },
    { name: 'Renault Trucks', models: ['D', 'C', 'T'] },
    { name: 'Scania', models: ['P', 'G', 'R', 'S'] },
    { name: 'Volvo', models: ['FL', 'FM', 'FH'] },
  ];

  for (const car of cars) {
    const make = await upsertMakeWithType(car.name, VehicleType.CAR);

    for (const modelName of car.models) {
      await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelName } },
        update: {},
        create: { makeId: make.id, name: modelName },
      });
    }
  }

  for (const moto of motorcycles) {
    const make = await upsertMakeWithType(moto.name, VehicleType.MOTORCYCLE);

    for (const modelName of moto.models) {
      await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelName } },
        update: {},
        create: { makeId: make.id, name: modelName },
      });
    }
  }

  for (const truck of trucks) {
    const make = await upsertMakeWithType(truck.name, VehicleType.TRUCK);

    for (const modelName of truck.models) {
      await prisma.vehicleModel.upsert({
        where: { makeId_name: { makeId: make.id, name: modelName } },
        update: {},
        create: { makeId: make.id, name: modelName },
      });
    }
  }

  console.log('Vehicle makes & models seeded.');
}

async function upsertMakeWithType(name: string, type: VehicleType) {
  const existing = await prisma.vehicleMake.findUnique({ where: { name } });
  if (!existing) {
    return prisma.vehicleMake.create({
      data: { name, types: [type] },
    });
  }

  const types = existing.types.includes(type) ? existing.types : [...existing.types, type];
  return prisma.vehicleMake.update({
    where: { name },
    data: { types: { set: types } },
  });
}

async function seedInternalCategories() {
  for (const parent of INTERNAL_CATEGORY_TREE) {
    const parentRecord = await prisma.internalCategory.upsert({
      where: { slug: parent.slug },
      update: {},
      create: { name: parent.name, slug: parent.slug },
    });

    for (const child of parent.children) {
      await prisma.internalCategory.upsert({
        where: { slug: child.slug },
        update: {},
        create: { name: child.name, slug: child.slug, parentId: parentRecord.id },
      });
    }
  }

  console.log('Internal categories seeded.');
}

async function seedMockCategoryMappings() {
  const platforms = [Platform.ALLEGRO];
  const categories = await prisma.internalCategory.findMany({ where: { parentId: { not: null } } });

  for (const category of categories) {
    for (const platform of platforms) {
      await prisma.platformCategoryMapping.upsert({
        where: { internalCategoryId_platform: { internalCategoryId: category.id, platform } },
        update: {},
        create: {
          internalCategoryId: category.id,
          platform,
          externalCategoryId: `MOCK-${platform}-${category.slug}`,
          externalCategoryName: `[MOCK] ${category.name}`,
          attributeSchema: {},
        },
      });
    }
  }

  console.log('Mock category mappings seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
