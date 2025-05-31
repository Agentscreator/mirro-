// lib/openai.ts
import OpenAI from 'openai';

// Initialize the OpenAI client
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to generate user connection explanations
export async function generateExplanation(
  userASummary: string,
  userBSummary: string,
  userANickname: string,
  userBNickname: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", 
      messages: [
        {
          role: "system",
          content: `You create explanations about why two users might connect. Write in 80-100 words total. The first half should be a narrative about the person being recommended (using their nickname), describing their journey and approach. The second half should explain similarities and potential connections, addressing the user as "you" and referring to the recommended person by their nickname.

Examples:
"Alex documents their creative process through thoughtful reflections, capturing moments of inspiration and struggle alike. Their entries about finding balance between structure and spontaneity in art mirror your own creative journey. Your shared passion for mindfulness practices and creative expression suggests a potential meaningful connection. Their experience with meditation retreats aligns with your interest in developing a consistent practice, while their approach to integrating creativity into daily life complements your exploration of artistic expression as a form of self-discovery."

"Belle uses Mirro to remember who she was when the world told her to forget. Her journal entries about self-discovery and resilience mirror your own journey of finding authenticity in a world that often demands conformity. The way she describes her hiking adventures and moments of clarity while surrounded by nature resonates with your own reflections. You both share a deep appreciation for literature that explores identity and transformation. Her perspective on coming-of-age stories could complement your interest in narratives about personal growth and self-acceptance. You're both navigating similar life transitions with thoughtfulness and introspection."`
        },
        {
          role: "user",
          content: `Generate an 80-100 word explanation for why you should connect with ${userBNickname}.
          
          First half: Write a narrative about ${userBNickname} and their journey/approach based on: ${userBSummary}
          
          Second half: Explain similarities and connections between you (the user) and ${userBNickname}, addressing the user directly as "you". You (the user) are described as: ${userASummary}`
        }
      ],
      max_tokens: 120,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating explanation:", error);
    return "We think you two might have a lot in common based on your thoughts and interests.";
  }
}