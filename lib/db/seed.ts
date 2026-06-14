import { 
  INITIAL_EQUIPMENT, 
  INITIAL_CUSTOMERS, 
  INITIAL_BOOKINGS, 
  INITIAL_MAINTENANCE 
} from "../mock-data";
import { 
  EquipmentModel, 
  CustomerModel, 
  BookingModel, 
  MaintenanceLogModel 
} from "./models";

export async function seedDatabase() {
  try {
    // 1. Seed Equipment
    const equipmentCount = await EquipmentModel.countDocuments();
    if (equipmentCount === 0) {
      console.log("Seeding equipment collections...");
      const equipmentData = INITIAL_EQUIPMENT.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await EquipmentModel.insertMany(equipmentData);
      console.log("Equipment collections seeded successfully!");
    }

    // 2. Seed Customers
    const customerCount = await CustomerModel.countDocuments();
    if (customerCount === 0) {
      console.log("Seeding customer collections...");
      const customerData = INITIAL_CUSTOMERS.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await CustomerModel.insertMany(customerData);
      console.log("Customer collections seeded successfully!");
    }

    // 3. Seed Bookings
    const bookingCount = await BookingModel.countDocuments();
    if (bookingCount === 0) {
      console.log("Seeding booking collections...");
      const bookingData = INITIAL_BOOKINGS.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await BookingModel.insertMany(bookingData);
      console.log("Booking collections seeded successfully!");
    }

    // 4. Seed Maintenance Logs
    const maintenanceCount = await MaintenanceLogModel.countDocuments();
    if (maintenanceCount === 0) {
      console.log("Seeding maintenance log collections...");
      const maintenanceData = INITIAL_MAINTENANCE.map(({ id, ...rest }) => ({
        _id: id,
        ...rest
      }));
      await MaintenanceLogModel.insertMany(maintenanceData);
      console.log("Maintenance log collections seeded successfully!");
    }
  } catch (error) {
    console.error("Database seeding encountered an error:", error);
  }
}
