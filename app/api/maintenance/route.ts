import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { MaintenanceLogModel, EquipmentModel } from "@/lib/db/models";

export async function GET() {
  try {
    await dbConnect();
    const logs = await MaintenanceLogModel.find({});
    return NextResponse.json(logs);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const newLog = new MaintenanceLogModel({
      _id: `maint-${Date.now()}`,
      equipmentId: data.equipmentId,
      equipmentName: data.equipmentName,
      description: data.description,
      cost: Number(data.cost),
      reportedDate: data.reportedDate,
      status: "Pending",
      technician: data.technician,
    });

    await newLog.save();

    // Set the machine maintenance status to "Requires Service"
    await EquipmentModel.findByIdAndUpdate(data.equipmentId, {
      $set: { maintenanceStatus: "Requires Service" },
    });

    return NextResponse.json(newLog);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
