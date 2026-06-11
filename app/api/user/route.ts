import { db } from "@/lib/db";
import { usersTable } from "@/lib/schema";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    console.log("[USER API] Start");
    try {
        const user = await currentUser();
        console.log("[USER API] User:", user);

        if (!user) {
            console.error("[USER API] currentUser() returned null");
            return NextResponse.json({ error: "Unauthorized: User session not found" }, { status: 401 });
        }

        const email = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
        console.log("[USER API] Email:", email);

        if (!email) {
            console.error("[USER API] Missing email address");
            return NextResponse.json({ error: "Bad Request: No email associated with user account" }, { status: 400 });
        }

        // 1. Check if user exists by ID (primary key constraint)
        let existingById;
        try {
            existingById = await db.select().from(usersTable)
                .where(eq(usersTable.id, user.id))
                .limit(1);
        } catch (dbErr: any) {
            console.error("[USER API] DB select by ID failed:", dbErr);
            return NextResponse.json({ error: "Database Error: Failed to query user by ID", details: dbErr.message }, { status: 500 });
        }

        if (existingById.length > 0) {
            const dbUser = existingById[0];
            if (dbUser.email !== email || dbUser.name !== (user.fullName || "User")) {
                console.log("[USER API] Updating user email/name for ID:", user.id);
                try {
                    const updatedUser = await db.update(usersTable)
                        .set({ 
                            email: email, 
                            name: user.fullName || "User" 
                        })
                        .where(eq(usersTable.id, user.id))
                        .returning();
                    return NextResponse.json(updatedUser[0]);
                } catch (updateErr: any) {
                    console.error("[USER API] DB update email by ID failed:", updateErr);
                    return NextResponse.json({ error: "Database Error: Failed to update user email", details: updateErr.message }, { status: 500 });
                }
            }
            console.log("[USER API] User already exists by ID and is up to date");
            return NextResponse.json(dbUser);
        }

        // 2. Check if user exists by Email (unique constraint)
        let existingByEmail;
        try {
            existingByEmail = await db.select().from(usersTable)
                .where(eq(usersTable.email, email))
                .limit(1);
        } catch (dbErr: any) {
            console.error("[USER API] DB select by email failed:", dbErr);
            return NextResponse.json({ error: "Database Error: Failed to query user by email", details: dbErr.message }, { status: 500 });
        }

        if (existingByEmail.length > 0) {
            console.log("[USER API] Updating user ID/name for Email:", email);
            try {
                const updatedUser = await db.update(usersTable)
                    .set({ 
                        id: user.id, 
                        name: user.fullName || "User" 
                    })
                    .where(eq(usersTable.email, email))
                    .returning();
                return NextResponse.json(updatedUser[0]);
            } catch (updateErr: any) {
                console.error("[USER API] DB update ID by email failed:", updateErr);
                return NextResponse.json({ error: "Database Error: Failed to update user ID mapping", details: updateErr.message }, { status: 500 });
            }
        }

        // 3. Neither exists, insert new user
        console.log("[USER API] Inserting new user:", user.id);
        try {
            const newUser = await db.insert(usersTable).values({
                id: user.id,
                email: email,
                name: user.fullName || "User",
            }).returning();
            return NextResponse.json(newUser[0]);
        } catch (insertErr: any) {
            console.error("[USER API] DB insert failed:", insertErr);
            return NextResponse.json({ error: "Database Error: Failed to register new user", details: insertErr.message }, { status: 500 });
        }

    } catch (err: any) {
        console.error("[USER API] Global error caught:", err);
        return NextResponse.json({ error: "Internal Server Error", details: err.message }, { status: 500 });
    }
}