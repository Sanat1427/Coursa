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

    const existingUser = await db.select().from(usersTable).where(eq(usersTable.email, user.primaryEmailAddress.emailAddress));
    if (existingUser.length > 0) {
        if (existingUser[0].id !== user.id) {
            const updatedUser = await db.update(usersTable)
                .set({ id: user.id, name: user.fullName || "User" })
                .where(eq(usersTable.email, user.primaryEmailAddress.emailAddress))
                .returning();
            return NextResponse.json(updatedUser[0]);
        }
        return NextResponse.json(existingUser[0]);
    }

    const newUser = await db.insert(usersTable).values({
        id: user.id,
        email: user.primaryEmailAddress.emailAddress,
        name: user.fullName || "User",
    }).returning();

    return NextResponse.json(newUser[0]);
}