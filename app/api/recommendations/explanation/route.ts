// app/api/recommendations/explanation/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { generateConnectionExplanation } from "@/src/lib/recommendationService";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get recommended user from request body
    const { recommendedUser } = await request.json();
        
    if (!recommendedUser || !recommendedUser.id) {
      return NextResponse.json(
        { error: "Missing required information" },
        { status: 400 }
      );
    }
        
    // Generate explanation
    const explanation = await generateConnectionExplanation(
      recommendedUser,
      session.user.id
    );
        
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Error generating explanation:", error);
    return NextResponse.json(
      { error: "Failed to generate explanation" },
      { status: 500 }
    );
  }
}