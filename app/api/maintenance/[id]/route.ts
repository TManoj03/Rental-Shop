import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { MaintenanceLogModel, EquipmentModel } from "@/lib/db/models";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await params;
    const { status, cost } = await request.json();

    const log = await MaintenanceLogModel.findById(id);
    if (!log) {
      return NextResponse.json({ error: "Maintenance log not found" }, { status: 404 });
    }

    log.status = status;
    if (cost !== undefined) {
      log.cost = Number(cost);
    }

    if (status === "Completed") {
      log.completedDate = new Date().toISOString().split("T")[0];
      
      // Restore equipment status to Good
      await EquipmentModel.findByIdAndUpdate(log.equipmentId, {
        $set: { maintenanceStatus: "Good" }
      });
    } else if (status === "In Progress") {
      // Set equipment status to Under Repair
      await EquipmentModel.findByIdAndUpdate(log.equipmentId, {
        $set: { maintenanceStatus: "Under Repair" }
      });
    } else if (status === "Pending") {
      // Set equipment status to Requires Service
      await EquipmentModel.findByIdAndUpdate(log.equipmentId, {
        $set: { maintenanceStatus: "Requires Service" }
      });
    }

    await log.save();
    return NextResponse.json(log);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
