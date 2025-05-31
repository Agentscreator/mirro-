// app/api/users/profile-image/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import { db } from "@/src/db";
import { usersTable } from "@/src/db/schema";
import { eq } from "drizzle-orm";
import { put } from '@vercel/blob';

async function uploadToStorage(options: {
  buffer: Buffer;
  filename: string;
  mimetype: string;
  folder?: string;
}): Promise<string> {
  const { buffer, filename, mimetype, folder = "profile-images" } = options;
  
  const timestamp = Date.now();
  const fileExtension = filename.split('.').pop();
  const uniqueFilename = `${timestamp}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
  const pathname = `${folder}/${uniqueFilename}`;

  const blob = await put(pathname, buffer, {
    access: 'public',
    contentType: mimetype,
  });

  return blob.url;
}

export async function POST(req: NextRequest) {
  try {
    console.log("Profile image upload started");
    
    // 1) Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    // 2) Parse form data
    const formData = await req.formData();
    console.log("FormData keys:", Array.from(formData.keys()));
    
    const file = formData.get('profileImage') as File;
    
    if (!file) {
      console.log("No file found in formData");
      return NextResponse.json({ message: "No file uploaded" }, { status: 400 });
    }

    console.log("File received:", {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ message: "File must be an image" }, { status: 400 });
    }

    // Validate file size (e.g., max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ message: "File too large (max 5MB)" }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3) Upload to Vercel Blob storage
    const imageUrl = await uploadToStorage({
      buffer,
      filename: file.name,
      mimetype: file.type,
      folder: "profile-images",
    });

    // 4) Persist to your DB via Drizzle
    await db
      .update(usersTable)
      .set({ profileImage: imageUrl })
      .where(eq(usersTable.id, userId));

    console.log("Profile image uploaded successfully:", imageUrl);

    // 5) Return the new URL
    return NextResponse.json({ imageUrl });

  } catch (error: any) {
    console.error("Profile-image upload error:", error);
    return NextResponse.json(
      { message: error.message ?? "Upload failed" },
      { status: 500 }
    );
  }
}