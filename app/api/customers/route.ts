import { NextResponse } from "next/server";
import dbConnect from "@/lib/db/connect";
import { CustomerModel } from "@/lib/db/models";

export async function GET() {
  try {
    await dbConnect();
    const customers = await CustomerModel.find({});
    return NextResponse.json(customers);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const data = await request.json();

    const newCustomer = new CustomerModel({
      _id: `cust-${Date.now()}`,
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      activeRentalsCount: 0,
      totalSpend: 0
    });

    await newCustomer.save();
    return NextResponse.json(newCustomer);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
