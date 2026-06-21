import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { EquipmentModel } from "@/lib/db/models";

export async function GET() {
  try {
    await dbConnect();
    const equipment = await EquipmentModel.find({});
    return NextResponse.json(equipment);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const newEq = new EquipmentModel({
      _id: `eq-${Date.now()}`,
      name: data.name,
      category: data.category,
      dailyRate: Number(data.dailyRate),
      weeklyRate: Number(data.weeklyRate),
      totalStock: Number(data.totalStock),
      rentedCount: 0,
      status: "Available",
      model: data.model,
      serial: data.serial,
      maintenanceStatus: "Good",
      description: data.description,
      imageUrl: data.imageUrl || "",
    });

    await newEq.save();
    return NextResponse.json(newEq);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
