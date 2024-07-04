const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const industries = [
  'Technologie',
  'Gesundheit',
  'Bildung',
  'Finanzen',
  'Einzelhandel',
  'Onlineshop',
];

const companyTypes = [
  'GmbH',
  'AG',
  'Einzelunternehmen',
  'GbR',
];

const users = [
  { firstName: "Alice", lastName: "Smith", username: "alice", email: "alice@example.com", password: "password123", role: "user" },
  { firstName: "Bob", lastName: "Johnson", username: "bob", email: "bob@example.com", password: "password123", role: "user" },
  { firstName: "Charlie", lastName: "Williams", username: "charlie", email: "charlie@example.com", password: "password123", role: "user" },
  { firstName: "David", lastName: "Brown", username: "david", email: "david@example.com", password: "password123", role: "user" },
  { firstName: "Eve", lastName: "Jones", username: "eve", email: "eve@example.com", password: "password123", role: "user" },
  { firstName: "Frank", lastName: "Garcia", username: "frank", email: "frank@example.com", password: "password123", role: "user" },
  { firstName: "Grace", lastName: "Martinez", username: "grace", email: "grace@example.com", password: "password123", role: "user" },
  { firstName: "Hannah", lastName: "Rodriguez", username: "hannah", email: "hannah@example.com", password: "password123", role: "user" },
  { firstName: "Ivy", lastName: "Lee", username: "ivy", email: "ivy@example.com", password: "password123", role: "user" },
  { firstName: "Jack", lastName: "Walker", username: "jack", email: "jack@example.com", password: "password123", role: "user" },
];

const cases = [
  { name: "Tech", companyType: companyTypes[0], industry: industries[0] },
  { name: "HealthSolutions", companyType: companyTypes[1], industry: industries[1] },
  { name: "EducationInnovators", companyType: companyTypes[2], industry: industries[2] },
  { name: "FinanceExperts", companyType: companyTypes[3], industry: industries[3] },
  { name: "RetailHub", companyType: companyTypes[0], industry: industries[4] },
  { name: "OnlineShop", companyType: companyTypes[1], industry: industries[5] },
  { name: "MedicalTechnologies", companyType: companyTypes[2], industry: industries[1] },
  { name: "EdutechPioneers", companyType: companyTypes[3], industry: industries[2] },
  { name: "BankingGiants", companyType: companyTypes[0], industry: industries[3] },
  { name: "ShopifyExperts", companyType: companyTypes[1], industry: industries[5] },
];

async function main() {
  // Create users
  await Promise.all(
    users.map(async (userData) => {
      const existingUser = await prisma.user.findUnique({ where: { username: userData.username } });
      if (existingUser) {
        console.log(`User with username ${userData.username} already exists, skipping creation.`);
        return; // Skip creating this user
      }
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword,
        },
      });
    })
  );

  // Create cases
  await Promise.all(
    cases.map(async (caseData) => {
      await prisma.case.create({
        data: caseData,
      });
    })
  );

  // Assign users to cases
  const allUsers = await prisma.user.findMany();
  const allCases = await prisma.case.findMany();

  await Promise.all(
    allUsers.map(async (user) => {
      for (let i = 0; i < 3; i++) {
        const randomCase = allCases[Math.floor(Math.random() * allCases.length)];
        await prisma.userCase.create({
          data: {
            userId: user.id,
            caseId: randomCase.id,
          },
        });
      }
    })
  );
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
