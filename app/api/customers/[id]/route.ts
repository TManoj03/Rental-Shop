import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { CustomerModel, AuditLogModel } from "@/lib/db/models";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await dbConnect();
    const { id } = await params;
    const data = await request.json();

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    const changes: string[] = [];
    if (data.name && customer.name !== data.name) {
      changes.push(`Name changed from "${customer.name}" to "${data.name}"`);
    }
    if (data.company !== undefined && customer.company !== (data.company || "")) {
      changes.push(
        `Company changed from "${customer.company || ""}" to "${data.company || ""}"`,
      );
    }
    if (data.email !== undefined && customer.email !== (data.email || "")) {
      changes.push(`Email changed from "${customer.email || ""}" to "${data.email || ""}"`);
    }
    if (data.phone && customer.phone !== data.phone) {
      changes.push(`Phone changed from "${customer.phone}" to "${data.phone}"`);
    }

    if (data.name) customer.name = data.name;
    if (data.company !== undefined) customer.company = data.company || "";
    if (data.email !== undefined) customer.email = data.email || "";
    if (data.phone) customer.phone = data.phone;

    await customer.save();

    if (changes.length > 0) {
      const auditId = `audit-${Math.floor(100000 + Math.random() * 900000)}`;
      const auditLog = new AuditLogModel({
        _id: auditId,
        action: "Customer Profile Updated",
        entityId: id,
        entityType: "Customer",
        description: `Customer client "${customer.name}" (${customer.company}) profile updated: ${changes.join("; ")}`,
        // operator: "Mahesh Verma",
        details: { changes },
      });
      await auditLog.save();
    }

    return NextResponse.json(customer);
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

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 },
      );
    }

    if (customer.activeRentalsCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a customer with active rentals" },
        { status: 400 },
      );
    }

    await CustomerModel.findByIdAndDelete(id);

    const auditId = `audit-${Math.floor(100000 + Math.random() * 900000)}`;
    const auditLog = new AuditLogModel({
      _id: auditId,
      action: "Customer Profile Deleted",
      entityId: id,
      entityType: "Customer",
      description: `Customer client "${customer.name}" (${customer.company}) profile was deleted.`,
    });
    await auditLog.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
