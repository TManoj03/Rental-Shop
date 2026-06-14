import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { BookingModel, EquipmentModel, CustomerModel, AuditLogModel } from "@/lib/db/models";

export async function GET() {
  try {
    await dbConnect();
    const bookings = await BookingModel.find({});
    return NextResponse.json(bookings);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const bookingId = `bk-${Math.floor(1000 + Math.random() * 9000)}`;

    const firstItem = data.items && data.items[0];
    const newBooking = new BookingModel({
      _id: bookingId,
      items: data.items,
      equipmentId: firstItem ? firstItem.equipmentId : "",
      equipmentName: firstItem ? firstItem.equipmentName : "",
      customerId: data.customerId,
      customerName: data.customerName,
      companyName: data.companyName,
      startDate: data.startDate,
      endDate: data.endDate,
      totalCost: Number(data.totalCost),
      status: "Active"
    });

    await newBooking.save();

    // Increment rented count for each equipment in items
    for (const item of data.items) {
      await EquipmentModel.findByIdAndUpdate(item.equipmentId, {
        $inc: { rentedCount: Number(item.quantity) }
      });
    }

    // Increment active rentals count for customer
    await CustomerModel.findByIdAndUpdate(data.customerId, {
      $inc: { activeRentalsCount: 1 }
    });

    // Create Audit Log
    const itemsDescription = data.items.map((item: { quantity: number; equipmentName: string }) => `${item.quantity}x ${item.equipmentName}`).join(", ");
    const auditId = `audit-${Math.floor(100000 + Math.random() * 900000)}`;
    const auditLog = new AuditLogModel({
      _id: auditId,
      action: "Booking Created",
      entityId: bookingId,
      entityType: "Booking",
      description: `New contract ${bookingId} checked out: ${itemsDescription} for customer ${data.customerName} (${data.companyName}) starting from ${data.startDate} to ${data.endDate} (Cost: ₹${Number(data.totalCost).toLocaleString("en-IN")})`,
      operator: "Mahesh Verma",
      details: {
        items: data.items,
        customerId: data.customerId,
        customerName: data.customerName,
        companyName: data.companyName,
        startDate: data.startDate,
        endDate: data.endDate,
        totalCost: Number(data.totalCost),
        status: "Active"
      }
    });
    await auditLog.save();

    return NextResponse.json(newBooking);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

