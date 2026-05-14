import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { categories as categoriesTable, services as servicesTable, providers as providersTable, users as usersTable } from "@workspace/db";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const categories = [
  { id: "cat_1", name: "Cleaning", icon: "home", iconLibrary: "Feather", color: "#1A56DB", bgColor: "#EFF6FF" },
  { id: "cat_2", name: "AC Service", icon: "thermometer", iconLibrary: "Feather", color: "#059669", bgColor: "#ECFDF5" },
  { id: "cat_3", name: "Plumbing", icon: "droplet", iconLibrary: "Feather", color: "#0EA5E9", bgColor: "#F0F9FF" },
  { id: "cat_4", name: "Electrician", icon: "zap", iconLibrary: "Feather", color: "#D97706", bgColor: "#FFFBEB" },
  { id: "cat_5", name: "Appliances", icon: "tool", iconLibrary: "Feather", color: "#7C3AED", bgColor: "#F5F3FF" },
  { id: "cat_6", name: "Pest Control", icon: "shield", iconLibrary: "Feather", color: "#DC2626", bgColor: "#FEF2F2" },
  { id: "cat_7", name: "Painting", icon: "edit-2", iconLibrary: "Feather", color: "#DB2777", bgColor: "#FDF2F8" },
  { id: "cat_8", name: "Carpentry", icon: "layers", iconLibrary: "Feather", color: "#92400E", bgColor: "#FFF7ED" },
];

const services = [
  { id: "svc_1", categoryId: "cat_1", categoryName: "Cleaning", name: "Home Deep Cleaning", description: "Complete deep cleaning of your home including kitchen, bathrooms, bedrooms and living areas. Our trained professionals use eco-friendly products.", price: 899, duration: 240, rating: 4.8, reviewCount: 2847, popular: true, includes: ["Kitchen cleaning", "Bathroom scrubbing", "Floor mopping", "Dusting & vacuuming", "Sofa cleaning"] },
  { id: "svc_2", categoryId: "cat_1", categoryName: "Cleaning", name: "Bathroom Cleaning", description: "Professional deep cleaning of all bathrooms with specialized products for tiles, fixtures and drains.", price: 349, duration: 60, rating: 4.7, reviewCount: 1923, popular: false, includes: ["Tile scrubbing", "Fixture polishing", "Drain cleaning", "Mirror cleaning", "Floor mopping"] },
  { id: "svc_3", categoryId: "cat_2", categoryName: "AC Service", name: "AC Service & Cleaning", description: "Complete servicing of split/window AC including cleaning filters, coil wash, gas check and performance optimization.", price: 699, duration: 90, rating: 4.9, reviewCount: 3421, popular: true, includes: ["Filter cleaning", "Coil wash", "Gas pressure check", "Performance test", "Indoor unit cleaning"] },
  { id: "svc_4", categoryId: "cat_2", categoryName: "AC Service", name: "AC Installation", description: "Professional installation of your new air conditioner with proper wiring, stand and gas filling.", price: 1299, duration: 120, rating: 4.8, reviewCount: 891, popular: false, includes: ["Indoor unit mounting", "Outdoor unit setup", "Copper pipe fitting", "Gas filling", "Test run"] },
  { id: "svc_5", categoryId: "cat_3", categoryName: "Plumbing", name: "Pipe Leak Repair", description: "Quick and effective repair of leaking pipes, joints, and fittings to prevent water damage.", price: 299, duration: 60, rating: 4.6, reviewCount: 1456, popular: false, includes: ["Leak detection", "Pipe repair/replace", "Joint sealing", "Water pressure check", "Post-repair test"] },
  { id: "svc_6", categoryId: "cat_3", categoryName: "Plumbing", name: "Tap & Faucet Repair", description: "Repair or replacement of leaking taps, mixers, and faucets in kitchen and bathrooms.", price: 199, duration: 45, rating: 4.7, reviewCount: 2108, popular: false, includes: ["Tap inspection", "Washer replacement", "Faucet tightening", "Leak sealing", "Flow adjustment"] },
  { id: "svc_7", categoryId: "cat_4", categoryName: "Electrician", name: "Electrical Safety Check", description: "Comprehensive inspection of all electrical connections, wiring, boards and fixtures for safety.", price: 499, duration: 90, rating: 4.8, reviewCount: 987, popular: false, includes: ["Board inspection", "Socket testing", "Wiring check", "MCB testing", "Safety report"] },
  { id: "svc_8", categoryId: "cat_4", categoryName: "Electrician", name: "Fan Installation", description: "Professional ceiling fan installation with proper wiring, capacitor setup and speed regulation.", price: 249, duration: 45, rating: 4.9, reviewCount: 3102, popular: true, includes: ["Fan unboxing", "Hook installation", "Wiring setup", "Capacitor fitting", "Speed test"] },
  { id: "svc_9", categoryId: "cat_5", categoryName: "Appliances", name: "Washing Machine Repair", description: "Expert diagnosis and repair of all washing machine issues including motor, drum, pump and electronic faults.", price: 449, duration: 90, rating: 4.7, reviewCount: 1234, popular: false, includes: ["Fault diagnosis", "Part replacement", "Motor check", "Water pump repair", "Test cycle"] },
  { id: "svc_10", categoryId: "cat_5", categoryName: "Appliances", name: "Refrigerator Service", description: "Complete refrigerator service including cooling check, gas refill, compressor inspection and thermostat calibration.", price: 599, duration: 90, rating: 4.6, reviewCount: 876, popular: false, includes: ["Cooling check", "Gas top-up", "Compressor test", "Thermostat calibration", "Coil cleaning"] },
  { id: "svc_11", categoryId: "cat_6", categoryName: "Pest Control", name: "General Pest Control", description: "Complete home pest control treatment for cockroaches, ants, spiders and other common pests.", price: 799, duration: 120, rating: 4.5, reviewCount: 1567, popular: true, includes: ["Cockroach treatment", "Ant control", "Spider treatment", "Safe chemicals", "30-day warranty"] },
  { id: "svc_12", categoryId: "cat_7", categoryName: "Painting", name: "Interior Wall Painting", description: "Professional interior painting service with premium paints, proper surface preparation and clean finish.", price: 8999, duration: 480, rating: 4.8, reviewCount: 654, popular: false, includes: ["Surface prep", "Primer coat", "2 paint coats", "Furniture cover", "Clean-up"] },
];

const providers = [
  { id: "pro_1", name: "Rajesh Kumar", rating: 4.9, reviewCount: 892, experienceYears: 8, specializations: ["Cleaning", "Pest Control"], pricePerHour: 350, verified: true, completedJobs: 1247, initials: "RK", color: "#1A56DB" },
  { id: "pro_2", name: "Suresh Sharma", rating: 4.8, reviewCount: 643, experienceYears: 6, specializations: ["AC Service", "Electrician"], pricePerHour: 400, verified: true, completedJobs: 934, initials: "SS", color: "#059669" },
  { id: "pro_3", name: "Amit Singh", rating: 4.9, reviewCount: 1204, experienceYears: 10, specializations: ["Plumbing", "Appliances"], pricePerHour: 380, verified: true, completedJobs: 1891, initials: "AS", color: "#7C3AED" },
  { id: "pro_4", name: "Mohan Das", rating: 4.7, reviewCount: 421, experienceYears: 5, specializations: ["Painting", "Carpentry"], pricePerHour: 450, verified: true, completedJobs: 678, initials: "MD", color: "#D97706" },
  { id: "pro_5", name: "Vikram Patel", rating: 4.8, reviewCount: 763, experienceYears: 7, specializations: ["Electrician", "AC Service"], pricePerHour: 420, verified: true, completedJobs: 1102, initials: "VP", color: "#DC2626" },
  { id: "pro_6", name: "Dinesh Yadav", rating: 4.6, reviewCount: 312, experienceYears: 4, specializations: ["Cleaning", "Appliances"], pricePerHour: 300, verified: false, completedJobs: 489, initials: "DY", color: "#0EA5E9" },
];

const workerAccounts = [
  { email: "rajesh@urbanserve.com", name: "Rajesh Kumar", providerId: "pro_1", phone: "+91 98765 43210" },
  { email: "suresh@urbanserve.com", name: "Suresh Sharma", providerId: "pro_2", phone: "+91 98765 43211" },
  { email: "amit@urbanserve.com", name: "Amit Singh", providerId: "pro_3", phone: "+91 98765 43212" },
  { email: "mohan@urbanserve.com", name: "Mohan Das", providerId: "pro_4", phone: "+91 98765 43213" },
  { email: "vikram@urbanserve.com", name: "Vikram Patel", providerId: "pro_5", phone: "+91 98765 43214" },
  { email: "dinesh@urbanserve.com", name: "Dinesh Yadav", providerId: "pro_6", phone: "+91 98765 43215" },
];

async function seed() {
  console.log("Seeding categories...");
  await db.insert(categoriesTable).values(categories).onConflictDoNothing();

  console.log("Seeding services...");
  await db.insert(servicesTable).values(services).onConflictDoNothing();

  console.log("Seeding providers...");
  await db.insert(providersTable).values(providers).onConflictDoNothing();

  console.log("Seeding worker accounts...");
  const password = "worker123";
  const passwordHash = await bcrypt.hash(password, 12);

  for (const w of workerAccounts) {
    await db.insert(usersTable).values({
      email: w.email,
      passwordHash,
      name: w.name,
      phone: w.phone,
      role: "worker",
      workerProviderId: w.providerId,
    }).onConflictDoNothing();
  }

  console.log("\n✓ Seeded", categories.length, "categories,", services.length, "services,", providers.length, "providers");
  console.log("✓ Seeded", workerAccounts.length, "worker accounts (password: worker123)");
  console.log("\nWorker login credentials:");
  workerAccounts.forEach((w) => console.log(`  ${w.email} / worker123  →  ${w.name} (${w.providerId})`));

  await pool.end();
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
