import { NextRequest, NextResponse } from "next/server";

// TODO: Re-enable in future release
export async function POST(req: NextRequest) {
    return NextResponse.json(
        { error: "Feature Temporarily Disabled" },
        { status: 403 }
    );
}
