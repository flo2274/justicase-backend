const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

const industries = [
  "Technologie",
  "Gesundheit",
  "Bildung",
  "Finanzen",
  "Einzelhandel",
  "Onlineshop",
];

const companyTypes = ["GmbH", "AG", "Einzelunternehmen", "GbR"];

const users = [
  {
    firstName: "Alice",
    lastName: "Smith",
    username: "alice",
    email: "alice@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Bob",
    lastName: "Johnson",
    username: "bob",
    email: "bob@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Charlie",
    lastName: "Williams",
    username: "charlie",
    email: "charlie@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "David",
    lastName: "Brown",
    username: "david",
    email: "david@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Eve",
    lastName: "Jones",
    username: "eve",
    email: "eve@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Frank",
    lastName: "Garcia",
    username: "frank",
    email: "frank@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Grace",
    lastName: "Martinez",
    username: "grace",
    email: "grace@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Hannah",
    lastName: "Rodriguez",
    username: "hannah",
    email: "hannah@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Ivy",
    lastName: "Lee",
    username: "ivy",
    email: "ivy@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Jack",
    lastName: "Walker",
    username: "jack",
    email: "jack@example.com",
    password: "password123",
    role: "user",
  },
  // Additional users with unique email addresses
  {
    firstName: "Kate",
    lastName: "White",
    username: "kate",
    email: "kate@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Liam",
    lastName: "Miller",
    username: "liam",
    email: "liam@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Mia",
    lastName: "Davis",
    username: "mia",
    email: "mia@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Noah",
    lastName: "Garcia",
    username: "noah",
    email: "noah@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Olivia",
    lastName: "Brown",
    username: "olivia",
    email: "olivia@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "William",
    lastName: "Martinez",
    username: "william",
    email: "william@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Sophia",
    lastName: "Gonzalez",
    username: "sophia",
    email: "sophia@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "James",
    lastName: "Lopez",
    username: "james",
    email: "james@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Amelia",
    lastName: "Wilson",
    username: "amelia",
    email: "amelia@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Benjamin",
    lastName: "Taylor",
    username: "benjamin",
    email: "benjamin@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Charlotte",
    lastName: "Anderson",
    username: "charlotte",
    email: "charlotte@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Daniel",
    lastName: "Hernandez",
    username: "daniel",
    email: "daniel@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Emily",
    lastName: "Moore",
    username: "emily",
    email: "emily@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Michael",
    lastName: "Gonzalez",
    username: "michael",
    email: "michael@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Elizabeth",
    lastName: "Clark",
    username: "elizabeth",
    email: "elizabeth@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Alexander",
    lastName: "Lewis",
    username: "alexander",
    email: "alexander@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Abigail",
    lastName: "Walker",
    username: "abigail",
    email: "abigail@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Ryan",
    lastName: "Young",
    username: "ryan",
    email: "ryan@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Ella",
    lastName: "Hall",
    username: "ella",
    email: "ella@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Matthew",
    lastName: "Scott",
    username: "matthew",
    email: "matthew@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Samantha",
    lastName: "King",
    username: "samantha",
    email: "samantha@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Christopher",
    lastName: "Green",
    username: "christopher",
    email: "christopher@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Ava",
    lastName: "Baker",
    username: "ava",
    email: "ava@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Joseph",
    lastName: "Adams",
    username: "joseph",
    email: "joseph@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Madison",
    lastName: "Rivera",
    username: "madison",
    email: "madison@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Andrew",
    lastName: "Evans",
    username: "andrew",
    email: "andrew@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Oliver",
    lastName: "Perez",
    username: "oliver",
    email: "oliver@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Isabella",
    lastName: "Mitchell",
    username: "isabella",
    email: "isabella@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "William",
    lastName: "Roberts",
    username: "william",
    email: "william@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Avery",
    lastName: "Cook",
    username: "avery",
    email: "avery@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Jayden",
    lastName: "Bailey",
    username: "jayden",
    email: "jayden@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Sophie",
    lastName: "Parker",
    username: "sophie",
    email: "sophie@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Gabriel",
    lastName: "Miller",
    username: "gabriel",
    email: "gabriel@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Emma",
    lastName: "Morales",
    username: "emma",
    email: "emma@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Lucas",
    lastName: "Gutierrez",
    username: "lucas",
    email: "lucas@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Madeline",
    lastName: "Price",
    username: "madeline",
    email: "madeline@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Jackson",
    lastName: "Morris",
    username: "jackson",
    email: "jackson@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Lily",
    lastName: "Nguyen",
    username: "lily",
    email: "lily@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Henry",
    lastName: "Sanchez",
    username: "henry",
    email: "henry@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Victoria",
    lastName: "Morales",
    username: "victoria",
    email: "victoria@example.com",
    password: "password123",
    role: "user",
  },
  {
    firstName: "Dylan",
    lastName: "Russell",
    username: "dylan",
    email: "dylan@example.com",
    password: "password123",
    role: "user",
  },
];

const cases = [
  { name: "Tech", companyType: companyTypes[0], industry: industries[0] },
  {
    name: "HealthSolutions",
    companyType: companyTypes[1],
    industry: industries[1],
  },
  {
    name: "EducationInnovators",
    companyType: companyTypes[2],
    industry: industries[2],
  },
  {
    name: "FinanceExperts",
    companyType: companyTypes[3],
    industry: industries[3],
  },
  { name: "RetailHub", companyType: companyTypes[0], industry: industries[4] },
  { name: "OnlineShop", companyType: companyTypes[1], industry: industries[5] },
  {
    name: "MedicalTechnologies",
    companyType: companyTypes[2],
    industry: industries[1],
  },
  {
    name: "EdutechPioneers",
    companyType: companyTypes[3],
    industry: industries[2],
  },
  {
    name: "BankingGiants",
    companyType: companyTypes[0],
    industry: industries[3],
  },
  {
    name: "ShopifyExperts",
    companyType: companyTypes[1],
    industry: industries[5],
  },
  // New case
  { name: "Amazon", companyType: companyTypes[1], industry: industries[4] },
];

async function main() {
  // Create users
  await Promise.all(
    users.map(async (userData) => {
      const existingUser = await prisma.user.findUnique({
        where: { username: userData.username },
      });
      if (existingUser) {
        console.log(
          `User with username ${userData.username} already exists, skipping creation.`
        );
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
        const randomCase =
          allCases[Math.floor(Math.random() * allCases.length)];
        await prisma.userCase.create({
          data: {
            userId: user.id,
            caseId: randomCase.id,
          },
        });
      }
    })
  );

  // Find the Amazon case
  const amazonCase = await prisma.case.findUnique({
    where: { name: "Amazon" },
  });

  // Wähle 49 zufällige Benutzer aus
  const randomUsers = getRandomUsers(allUsers, 49);

  // Schreibe die ausgewählten Benutzer in den Amazon-Fall ein
  await Promise.all(
    randomUsers.map(async (user) => {
      await prisma.userCase.create({
        data: {
          userId: user.id,
          caseId: amazonCase.id,
        },
      });
      console.log(
        `Benutzer ${user.username} wurde dem Fall Amazon hinzugefügt.`
      );
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
