// src/lib/apiServices.ts

export interface RecommendedUser {
  id: string; // Changed to string for UUID
  username: string;
  nickname?: string | null; // Match database nullable type
  image?: string | null;
  tags?: string[];
  reason?: string | null;
  score?: number;
}

export interface RecommendationsResponse {
  users: RecommendedUser[];
  hasMore: boolean;
  nextPage: number | null;
  totalCount: number;
  currentPage: number;
}

export async function fetchRecommendations(
  page: number = 1, 
  pageSize: number = 2  // Changed from 'limit' to 'pageSize' to match your API
): Promise<RecommendationsResponse> {
  try {
    const response = await fetch(`/api/recommendations?page=${page}&pageSize=${pageSize}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetchRecommendations:', error);
    throw error;
  }
}

export async function generateExplanation(user: RecommendedUser): Promise<string> {
  try {
    const response = await fetch('/api/recommendations/explanation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recommendedUser: user  // Changed to match your API expectation
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Explanation API Error Response:', errorText);
      throw new Error(`Failed to generate explanation: ${response.statusText}`);
    }

    const data = await response.json();
    return data.explanation || "You might have some interesting things in common!";
  } catch (error) {
    console.error('Error in generateExplanation:', error);
    return "You might have some interesting things in common!";
  }
}