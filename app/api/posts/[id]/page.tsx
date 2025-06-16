import type { Metadata } from "next"
import PublicPostView from "./public-post-view"

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // Fetch post data for metadata
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/posts/${params.id}/public`, {
      cache: "no-store",
    })

    if (response.ok) {
      const post = await response.json()
      return {
        title: `${post.user?.nickname || post.user?.username || "User"}'s Post`,
        description: post.content ? post.content.slice(0, 160) : "Check out this post!",
        openGraph: {
          title: `${post.user?.nickname || post.user?.username || "User"}'s Post`,
          description: post.content ? post.content.slice(0, 160) : "Check out this post!",
          images: post.image ? [post.image] : [],
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title: `${post.user?.nickname || post.user?.username || "User"}'s Post`,
          description: post.content ? post.content.slice(0, 160) : "Check out this post!",
          images: post.image ? [post.image] : [],
        },
      }
    }
  } catch (error) {
    console.error("Error generating metadata:", error)
  }

  return {
    title: "Shared Post",
    description: "Check out this post!",
  }
}

export default function PublicPostPage({ params }: Props) {
  return <PublicPostView postId={params.id} />
}
