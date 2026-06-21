export interface Equipment {
  id: string;
  name: string;
  category: string;
  dailyRate: number;
  weeklyRate: number;
  totalStock: number;
  rentedCount: number;
  status: "Available" | "Out of Stock" | "Maintenance";
  model: string;
  serial: string;
  maintenanceStatus: "Good" | "Requires Service" | "Under Repair";
  description: string;
  imageUrl?: string;
}

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  activeRentalsCount: number;
  totalSpend: number;
}

export interface BookingItem {
  equipmentId: string;
  equipmentName: string;
  quantity: number;
}

export interface Booking {
  id: string;
  items: BookingItem[];
  customerId: string;
  customerName: string;
  companyName: string;
  startDate: string;
  endDate: string;
  actualReturnDate?: string;
  totalCost: number;
  paidAmount: number;      // advance / partial payment collected at booking time
  balanceDue: number;      // remaining amount to collect at return
  status: "Active" | "Completed" | "Overdue" | "Reserved";
}

export interface MaintenanceLog {
  id: string;
  equipmentId: string;
  equipmentName: string;
  description: string;
  cost: number;
  reportedDate: string;
  completedDate?: string;
  status: "Pending" | "In Progress" | "Completed";
  technician: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entityId: string;
  entityType: "Booking" | "Customer" | "Equipment" | "Maintenance";
  description: string;
  operator: string;
  details?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}


export interface RevenueData {
  month: string;
  revenue: number;
  rentals: number;
}

export interface CategoryDistribution {
  category: string;
  value: number;
  color: string;
}

export const INITIAL_EQUIPMENT: Equipment[] = [];

export const INITIAL_CUSTOMERS: Customer[] = [];

export const INITIAL_BOOKINGS: Booking[] = [];

export const INITIAL_MAINTENANCE: MaintenanceLog[] = [];


export const REVENUE_TRENDS: RevenueData[] = [
  { month: "Jan", revenue: 1120000, rentals: 42 },
  { month: "Feb", revenue: 1300000, rentals: 48 },
  { month: "Mar", revenue: 1650000, rentals: 62 },
  { month: "Apr", revenue: 2000000, rentals: 78 },
  { month: "May", revenue: 2450000, rentals: 95 },
  { month: "Jun", revenue: 2720000, rentals: 104 }
];

export const CATEGORY_DISTRIBUTION: CategoryDistribution[] = [
  { category: "Heavy Machinery", value: 45, color: "#f59e0b" }, // Amber
  { category: "Concrete & Masonry", value: 15, color: "#ea580c" }, // Orange
  { category: "Access & Scaffolding", value: 20, color: "#3b82f6" }, // Blue
  { category: "Power Tools", value: 12, color: "#10b981" }, // Emerald
  { category: "Generators & Light", value: 8, color: "#8b5cf6" } // Purple
];

// LocalStorage helpers
export const getStoredData = <T>(key: string, defaultValue: T): T => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error("Error reading localStorage", error);
    return defaultValue;
  }
};

export const setStoredData = <T>(key: string, value: T): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error writing localStorage", error);
  }
};
