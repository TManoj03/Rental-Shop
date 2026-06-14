import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { AuditLogModel } from "@/lib/db/models";

export async function GET() {
  try {
    await dbConnect();
    const logs = await AuditLogModel.find({}).sort({ createdAt: -1 });
    return NextResponse.json(logs);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
