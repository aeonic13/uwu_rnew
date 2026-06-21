import prisma from "../src/lib/server/prisma";

async function main() {
  // Dev shortcut: a single property manager that owns listings until auth exists.
  const manager = await prisma.user.upsert({
    where: { email: "dev.manager@rentra.local" },
    update: { name: "Dev Manager", roles: ["PROPMANAGER"] },
    create: {
      email: "dev.manager@rentra.local",
      name: "Dev Manager",
      roles: ["PROPMANAGER"],
      propManagerProfile: {
        create: { verified: true },
      },
    },
    include: { propManagerProfile: true },
  });

  console.log(
    `Seeded property manager ${manager.email} (profile ${manager.propManagerProfile?.id}).`
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
