import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { EquipmentModel, AuditLogModel } from "@/lib/db/models";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await request.json();

    const eq = await EquipmentModel.findById(id);
    if (!eq) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 },
      );
    }

    const changes: string[] = [];
    if (data.name && eq.name !== data.name) {
      changes.push(`Name changed from "${eq.name}" to "${data.name}"`);
    }
    if (data.category && eq.category !== data.category) {
      changes.push(
        `Category changed from "${eq.category}" to "${data.category}"`,
      );
    }
    if (
      data.dailyRate !== undefined &&
      eq.dailyRate !== Number(data.dailyRate)
    ) {
      changes.push(
        `Daily Rate changed from ₹${eq.dailyRate} to ₹${data.dailyRate}`,
      );
    }
    if (
      data.weeklyRate !== undefined &&
      eq.weeklyRate !== Number(data.weeklyRate)
    ) {
      changes.push(
        `Weekly Rate changed from ₹${eq.weeklyRate} to ₹${data.weeklyRate}`,
      );
    }
    if (
      data.totalStock !== undefined &&
      eq.totalStock !== Number(data.totalStock)
    ) {
      changes.push(
        `Total Stock changed from ${eq.totalStock} to ${data.totalStock}`,
      );
    }
    if (
      data.rentedCount !== undefined &&
      eq.rentedCount !== Number(data.rentedCount)
    ) {
      changes.push(
        `Rented Count changed from ${eq.rentedCount} to ${data.rentedCount}`,
      );
    }
    if (data.status && eq.status !== data.status) {
      changes.push(`Status changed from "${eq.status}" to "${data.status}"`);
    }
    if (data.model && eq.model !== data.model) {
      changes.push(`Model changed from "${eq.model}" to "${data.model}"`);
    }
    if (data.serial && eq.serial !== data.serial) {
      changes.push(`Serial changed from "${eq.serial}" to "${data.serial}"`);
    }
    if (
      data.maintenanceStatus &&
      eq.maintenanceStatus !== data.maintenanceStatus
    ) {
      changes.push(
        `Maintenance status changed from "${eq.maintenanceStatus}" to "${data.maintenanceStatus}"`,
      );
    }
    if (data.description && eq.description !== data.description) {
      changes.push(`Description updated`);
    }

    if (data.name) eq.name = data.name;
    if (data.category) eq.category = data.category;
    if (data.dailyRate !== undefined) eq.dailyRate = Number(data.dailyRate);
    if (data.weeklyRate !== undefined) eq.weeklyRate = Number(data.weeklyRate);
    if (data.totalStock !== undefined) eq.totalStock = Number(data.totalStock);
    if (data.rentedCount !== undefined)
      eq.rentedCount = Number(data.rentedCount);
    if (data.status) eq.status = data.status;
    if (data.model) eq.model = data.model;
    if (data.serial) eq.serial = data.serial;
    if (data.maintenanceStatus) eq.maintenanceStatus = data.maintenanceStatus;
    if (data.description) eq.description = data.description;
    if (data.imageUrl !== undefined) eq.imageUrl = data.imageUrl;

    await eq.save();

    if (changes.length > 0) {
      const auditId = `audit-${Math.floor(100000 + Math.random() * 900000)}`;
      const auditLog = new AuditLogModel({
        _id: auditId,
        action: "Equipment Asset Updated",
        entityId: id,
        entityType: "Equipment",
        description: `Equipment asset "${eq.name}" updated: ${changes.join("; ")}`,
        // operator: "Mahesh Verma",
        details: { changes },
      });
      await auditLog.save();
    }

    return NextResponse.json(eq);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;

    const deleted = await EquipmentModel.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json(
        { error: "Equipment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
