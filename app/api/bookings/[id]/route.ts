import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import {
  BookingModel,
  EquipmentModel,
  CustomerModel,
  AuditLogModel,
} from "@/lib/db/models";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await request.json();

    const booking = await BookingModel.findById(id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Migration fallback for legacy bookings
    if (!booking.items || booking.items.length === 0) {
      if (booking.equipmentId) {
        booking.items = [
          {
            equipmentId: booking.equipmentId,
            equipmentName: booking.equipmentName,
            quantity: 1,
          },
        ];
      } else {
        booking.items = [];
      }
    }

    const oldStatus = booking.status;
    const newStatus = data.status || oldStatus;
    const oldCustId = booking.customerId;
    const newCustId = data.customerId || oldCustId;
    const oldCost = booking.totalCost;
    const newCost =
      data.totalCost !== undefined ? Number(data.totalCost) : oldCost;

    // Fetch customer details if swapped
    let newCustName = booking.customerName;
    let newCompanyName = booking.companyName;
    if (data.customerId && data.customerId !== oldCustId) {
      const cust = await CustomerModel.findById(data.customerId);
      if (cust) {
        newCustName = cust.name;
        newCompanyName = cust.company;
      }
    }

    // 1. Equipment rentedCount updates (dynamic stock delta calculation)
    const wasRenting = oldStatus === "Active" || oldStatus === "Overdue";
    const isRenting = newStatus === "Active" || newStatus === "Overdue";

    const oldEqMap: Record<string, number> = {};
    if (wasRenting && booking.items) {
      for (const item of booking.items) {
        oldEqMap[item.equipmentId] =
          (oldEqMap[item.equipmentId] || 0) + Number(item.quantity);
      }
    }

    const newEqMap: Record<string, number> = {};
    const updatedItems = data.items || booking.items;
    if (isRenting && updatedItems) {
      for (const item of updatedItems) {
        newEqMap[item.equipmentId] =
          (newEqMap[item.equipmentId] || 0) + Number(item.quantity);
      }
    }

    const allEqIds = new Set([
      ...Object.keys(oldEqMap),
      ...Object.keys(newEqMap),
    ]);
    for (const eqId of allEqIds) {
      const oldQty = oldEqMap[eqId] || 0;
      const newQty = newEqMap[eqId] || 0;
      const delta = newQty - oldQty;
      if (delta !== 0) {
        await EquipmentModel.findByIdAndUpdate(eqId, {
          $inc: { rentedCount: delta },
        });
      }
    }

    // 2. Customer activeRentalsCount updates
    if (wasRenting && isRenting && oldCustId !== newCustId) {
      await CustomerModel.findByIdAndUpdate(oldCustId, {
        $inc: { activeRentalsCount: -1 },
      });
      await CustomerModel.findByIdAndUpdate(newCustId, {
        $inc: { activeRentalsCount: 1 },
      });
    } else if (wasRenting && !isRenting) {
      await CustomerModel.findByIdAndUpdate(oldCustId, {
        $inc: { activeRentalsCount: -1 },
      });
    } else if (!wasRenting && isRenting) {
      await CustomerModel.findByIdAndUpdate(newCustId, {
        $inc: { activeRentalsCount: 1 },
      });
    }

    // 3. Customer totalSpend updates
    const wasCompleted = oldStatus === "Completed";
    const isCompleted = newStatus === "Completed";

    if (wasCompleted && isCompleted) {
      if (oldCustId !== newCustId) {
        await CustomerModel.findByIdAndUpdate(oldCustId, {
          $inc: { totalSpend: -oldCost },
        });
        await CustomerModel.findByIdAndUpdate(newCustId, {
          $inc: { totalSpend: newCost },
        });
      } else if (oldCost !== newCost) {
        await CustomerModel.findByIdAndUpdate(oldCustId, {
          $inc: { totalSpend: newCost - oldCost },
        });
      }
    } else if (wasCompleted && !isCompleted) {
      await CustomerModel.findByIdAndUpdate(oldCustId, {
        $inc: { totalSpend: -oldCost },
      });
    } else if (!wasCompleted && isCompleted) {
      await CustomerModel.findByIdAndUpdate(newCustId, {
        $inc: { totalSpend: newCost },
      });
    }

    // Build changes for audit log
    const changes: string[] = [];
    if (oldCustId !== newCustId) {
      changes.push(
        `Customer changed from "${booking.customerName}" to "${newCustName}"`,
      );
    }

    const oldItemsDesc = booking.items
      .map(
        (i: { quantity: number; equipmentName: string }) =>
          `${i.quantity}x ${i.equipmentName}`,
      )
      .join(", ");
    const newItemsDesc = updatedItems
      .map(
        (i: { quantity: number; equipmentName: string }) =>
          `${i.quantity}x ${i.equipmentName}`,
      )
      .join(", ");
    if (oldItemsDesc !== newItemsDesc) {
      changes.push(`Items changed from [${oldItemsDesc}] to [${newItemsDesc}]`);
    }

    if (data.startDate && booking.startDate !== data.startDate) {
      changes.push(
        `Start Date changed from "${booking.startDate}" to "${data.startDate}"`,
      );
    }
    if (data.endDate && booking.endDate !== data.endDate) {
      changes.push(
        `End Date changed from "${booking.endDate}" to "${data.endDate}"`,
      );
    }
    if (oldCost !== newCost) {
      changes.push(
        `Total Cost changed from ₹${oldCost.toLocaleString("en-IN")} to ₹${newCost.toLocaleString("en-IN")}`,
      );
    }
    if (oldStatus !== newStatus) {
      changes.push(`Status changed from "${oldStatus}" to "${newStatus}"`);
    }

    // Update the booking object
    booking.items = updatedItems;
    booking.customerId = newCustId;
    booking.customerName = newCustName;
    booking.companyName = newCompanyName;
    if (data.startDate) booking.startDate = data.startDate;
    if (data.endDate) booking.endDate = data.endDate;
    booking.totalCost = newCost;
    booking.status = newStatus;

    // Persist payment fields if provided
    if (data.paidAmount !== undefined) booking.paidAmount = Number(data.paidAmount);
    if (data.balanceDue !== undefined) booking.balanceDue = Number(data.balanceDue);

    if (newStatus === "Completed") {
      booking.actualReturnDate =
        data.actualReturnDate ||
        booking.actualReturnDate ||
        new Date().toISOString().split("T")[0];
    } else {
      booking.actualReturnDate = undefined;
    }

    // Clear legacy fields
    booking.equipmentId = undefined;
    booking.equipmentName = undefined;

    await booking.save();

    // Create Audit Log
    if (changes.length > 0) {
      let action = "Booking Updated";
      let description = `Contract ${id} details updated: ${changes.join("; ")}`;

      if (
        oldStatus !== "Completed" &&
        newStatus === "Completed" &&
        oldStatus !== "Reserved"
      ) {
        action = "Booking Checked In";
        description = `Contract ${id} checked in: ${newItemsDesc} returned by customer "${newCustName}"${newCompanyName ? ` (${newCompanyName})` : ""}`;
      } else if (oldStatus !== "Overdue" && newStatus === "Overdue") {
        action = "Booking Flagged Overdue";
        description = `Contract ${id} flagged overdue: Customer "${newCustName}"${newCompanyName ? ` (${newCompanyName})` : ""} has not returned ${newItemsDesc}`;
      }

      const auditId = `audit-${Math.floor(100000 + Math.random() * 900000)}`;
      const auditLog = new AuditLogModel({
        _id: auditId,
        action,
        entityId: id,
        entityType: "Booking",
        description,
        // operator: "Mahesh Verma",
        details: {
          changes: changes,
          before: {
            customerId: oldCustId,
            items: booking.items,
            startDate: booking.startDate,
            endDate: booking.endDate,
            totalCost: oldCost,
            status: oldStatus,
          },
          after: {
            customerId: newCustId,
            items: updatedItems,
            startDate: data.startDate || booking.startDate,
            endDate: data.endDate || booking.endDate,
            totalCost: newCost,
            status: newStatus,
          },
        },
      });
      await auditLog.save();
    }

    return NextResponse.json(booking);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
