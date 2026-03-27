import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { username: "SneakerKing" },
      update: {},
      create: { username: "SneakerKing" },
    }),
    prisma.user.upsert({
      where: { username: "HypeBeast99" },
      update: {},
      create: { username: "HypeBeast99" },
    }),
    prisma.user.upsert({
      where: { username: "JordanHead" },
      update: {},
      create: { username: "JordanHead" },
    }),
    prisma.user.upsert({
      where: { username: "StockXFlip" },
      update: {},
      create: { username: "StockXFlip" },
    }),
    prisma.user.upsert({
      where: { username: "AirMaxFan" },
      update: {},
      create: { username: "AirMaxFan" },
    }),
  ]);

  console.log(`✅ Created ${users.length} users`);

  // Create demo sneaker drops
  const drops = await Promise.all([
    prisma.drop.upsert({
      where: { id: "drop-jordan-1" },
      update: {},
      create: {
        id: "drop-jordan-1",
        name: "Air Jordan 1 Retro High OG",
        price: 180,
        totalStock: 5,
        availableStock: 5,
        startTime: new Date(),
        brand: "Jordan Brand",
        colorway: "Chicago Red/White/Black",
        description:
          "The iconic colorway that started it all. These are extremely limited — only 5 pairs available.",
        imageUrl:
          "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
      },
    }),
    prisma.drop.upsert({
      where: { id: "drop-yeezy-350" },
      update: {},
      create: {
        id: "drop-yeezy-350",
        name: "Yeezy Boost 350 V2",
        price: 220,
        totalStock: 3,
        availableStock: 3,
        startTime: new Date(),
        brand: "Adidas Yeezy",
        colorway: "Zebra",
        description:
          "Ultra-rare Zebra colorway. Boost cushioning for all-day comfort. Only 3 pairs left!",
        imageUrl:
          "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=400&fit=crop",
      },
    }),
    prisma.drop.upsert({
      where: { id: "drop-dunk-low" },
      update: {},
      create: {
        id: "drop-dunk-low",
        name: "Nike SB Dunk Low Pro",
        price: 110,
        totalStock: 8,
        availableStock: 8,
        startTime: new Date(),
        brand: "Nike SB",
        colorway: "Panda Black/White",
        description:
          "The most hyped colorway of the year. Skate-ready construction meets street style.",
        imageUrl:
          "https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=400&fit=crop",
      },
    }),
  ]);

  console.log(`✅ Created ${drops.length} drops`);
  console.log("\n📋 Demo Users:");
  users.forEach((u) => console.log(`  - ${u.username} (${u.id})`));
  console.log("\n👟 Demo Drops:");
  drops.forEach((d) =>
    console.log(`  - ${d.name}: ${d.availableStock}/${d.totalStock} units`)
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
