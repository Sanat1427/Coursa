import { db } from "@/config/db";
import { usersTable } from "@/config/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
    const user = await currentUser();

    if (!user || !user.primaryEmailAddress?.emailAddress) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const newUser = await db.insert(usersTable).values({
        email: user.primaryEmailAddress.emailAddress,
        name: user.fullName || "User",
    }).onConflictDoNothing({ target: usersTable.email }).returning();

    if (newUser.length === 0) {
        const existingUsers = await db.select().from(usersTable).where(eq(usersTable.email, user.primaryEmailAddress.emailAddress));
        return NextResponse.json(existingUsers[0]);
    }

    return NextResponse.json(newUser[0]);
}