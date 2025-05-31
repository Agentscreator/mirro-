"use client"

import { useState, useEffect } from "react"
import { Lock, Plus, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"

const MAX_TOTAL_CHARS = 8000
const MAX_THOUGHT_CHARS = 1000

interface Thought {
  id: number
  title: string
  content: string
  createdAt: string
}

export default function TheMirrorPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([])
  const [loading, setLoading] = useState(true)
  const [newThought, setNewThought] = useState({
    title: "",
    content: "",
  })
  const [editingThought, setEditingThought] = useState<null | Thought>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  // Load thoughts from database on component mount
  useEffect(() => {
    fetchThoughts()
  }, [])

  const fetchThoughts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/thoughts')
      if (response.ok) {
        const data = await response.json()
        setThoughts(data)
      } else {
        console.error('Failed to fetch thoughts')
      }
    } catch (error) {
      console.error('Error fetching thoughts:', error)
    } finally {
      setLoading(false)
    }
  }

  const thoughtsCharCount = thoughts.reduce((acc, m) => acc + m.content.length, 0)
  const remainingChars = MAX_TOTAL_CHARS - thoughtsCharCount
  const usagePercentage = (thoughtsCharCount / MAX_TOTAL_CHARS) * 100

  const handleAddThought = async () => {
    if (!newThought.title || !newThought.content) return

    // Check if adding this thought would exceed the total character limit
    if (newThought.content.length > remainingChars) {
      alert(`You only have ${remainingChars} characters remaining. This thought is too long.`)
      return
    }

    try {
      const response = await fetch('/api/thoughts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newThought.title,
          content: newThought.content,
        }),
      })

      if (response.ok) {
        const savedThought = await response.json()
        setThoughts([savedThought, ...thoughts])
        setNewThought({
          title: "",
          content: "",
        })
        setIsAddDialogOpen(false)
      } else {
        console.error('Failed to save thought')
        alert('Failed to save thought. Please try again.')
      }
    } catch (error) {
      console.error('Error saving thought:', error)
      alert('Error saving thought. Please try again.')
    }
  }

  const handleEditThought = async () => {
    if (!editingThought || !editingThought.title || !editingThought.content) return

    // Calculate the difference in character count
    const originalThought = thoughts.find((t) => t.id === editingThought.id)
    const charDifference = editingThought.content.length - (originalThought?.content.length || 0)

    // Check if editing this thought would exceed the total character limit
    if (charDifference > 0 && charDifference > remainingChars) {
      alert(`You only have ${remainingChars} characters remaining. This edit adds too many characters.`)
      return
    }

    try {
      const response = await fetch(`/api/thoughts/${editingThought.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editingThought.title,
          content: editingThought.content,
        }),
      })

      if (response.ok) {
        const updatedThought = await response.json()
        setThoughts(thoughts.map((m) => (m.id === editingThought.id ? updatedThought : m)))
        setEditingThought(null)
        setIsEditDialogOpen(false)
      } else {
        console.error('Failed to update thought')
        alert('Failed to update thought. Please try again.')
      }
    } catch (error) {
      console.error('Error updating thought:', error)
      alert('Error updating thought. Please try again.')
    }
  }

  const handleDeleteThought = async (id: number) => {
    if (!confirm('Are you sure you want to delete this thought?')) return

    try {
      const response = await fetch(`/api/thoughts/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setThoughts(thoughts.filter((m) => m.id !== id))
      } else {
        console.error('Failed to delete thought')
        alert('Failed to delete thought. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting thought:', error)
      alert('Error deleting thought. Please try again.')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading your thoughts...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-600">Thoughts (Private)</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">New Thought</span>
              <span className="sm:hidden">New</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] rounded-xl bg-background/90 backdrop-blur-md border border-blue-200 w-[calc(100%-2rem)] mx-auto">
            <DialogHeader>
              <DialogTitle className="text-blue-600">Create New Thought</DialogTitle>
              <DialogDescription>
                Add a new thought to your mirror. These thoughts help Mirro generate connection recommendations.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={newThought.title}
                  onChange={(e) => setNewThought({ ...newThought, title: e.target.value })}
                  placeholder="Give your thought a title"
                  className="rounded-full bg-background/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={newThought.content}
                  onChange={(e) => {
                    // Limit the content to MAX_THOUGHT_CHARS
                    const content = e.target.value.slice(0, MAX_THOUGHT_CHARS)
                    setNewThought({ ...newThought, content })
                  }}
                  placeholder="Write your thought here..."
                  className="min-h-[150px] rounded-xl bg-background/50"
                />
                <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground">
                  <span className={newThought.content.length >= MAX_THOUGHT_CHARS ? "text-red-500" : ""}>
                    {newThought.content.length}/{MAX_THOUGHT_CHARS} characters
                  </span>
                  <span className="mt-1 sm:mt-0">{remainingChars} characters remaining in total</span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
                className="rounded-full bg-background/50 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddThought}
                className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                disabled={!newThought.title || !newThought.content || newThought.content.length > MAX_THOUGHT_CHARS}
              >
                Save Thought
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mb-6">
        <Card className="rounded-xl bg-card shadow-sm border border-blue-100">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-600">Thoughts</CardTitle>
            <CardDescription>Your thoughts help Mirro generate meaningful connections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl bg-background/50 p-3 border border-blue-50">
                <span>Character Usage</span>
                <div className="text-right">
                  <span className="font-medium">{thoughtsCharCount}</span>
                  <span className="text-muted-foreground"> / {MAX_TOTAL_CHARS}</span>
                </div>
              </div>
              <Progress value={usagePercentage} className="h-2 w-full bg-blue-100">
                <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, usagePercentage)}%` }} />
              </Progress>
              <div className="text-xs text-muted-foreground text-right">{remainingChars} characters remaining</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {thoughts.length === 0 ? (
        <Card className="rounded-xl bg-card shadow-sm border border-blue-100">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Lock className="h-12 w-12 text-blue-300 mb-4" />
            <h3 className="text-lg font-semibold text-blue-600 mb-2">No thoughts yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Start building your inner world by adding your first thought. These reflections help create meaningful connections.
            </p>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="rounded-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Thought
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {thoughts.map((thought) => (
            <Card key={thought.id} className="rounded-xl bg-card shadow-sm border border-blue-100">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-blue-600">{thought.title}</CardTitle>
                    <CardDescription>{formatDate(thought.createdAt)}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{thought.content}</p>
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row sm:justify-end gap-2">
                <Dialog
                  open={isEditDialogOpen && editingThought?.id === thought.id}
                  onOpenChange={(open) => {
                    setIsEditDialogOpen(open)
                    if (!open) setEditingThought(null)
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingThought(thought)}
                      className="rounded-full bg-background/50 border-blue-200 w-full sm:w-auto"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[550px] rounded-xl bg-background/90 backdrop-blur-md border border-blue-200 w-[calc(100%-2rem)] mx-auto">
                    <DialogHeader>
                      <DialogTitle className="text-blue-600">Edit Thought</DialogTitle>
                    </DialogHeader>
                    {editingThought && (
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="edit-title">Title</Label>
                          <Input
                            id="edit-title"
                            value={editingThought.title}
                            onChange={(e) => setEditingThought({ ...editingThought, title: e.target.value })}
                            className="rounded-full bg-background/50"
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="edit-content">Content</Label>
                          <Textarea
                            id="edit-content"
                            value={editingThought.content}
                            onChange={(e) => {
                              // Limit the content to MAX_THOUGHT_CHARS
                              const content = e.target.value.slice(0, MAX_THOUGHT_CHARS)
                              setEditingThought({ ...editingThought, content })
                            }}
                            className="min-h-[150px] rounded-xl bg-background/50"
                          />
                          <div className="flex flex-col sm:flex-row sm:justify-between text-xs text-muted-foreground">
                            <span className={editingThought.content.length >= MAX_THOUGHT_CHARS ? "text-red-500" : ""}>
                              {editingThought.content.length}/{MAX_THOUGHT_CHARS} characters
                            </span>
                            <span className="mt-1 sm:mt-0">
                              {remainingChars +
                                (thoughts.find((t) => t.id === editingThought.id)?.content.length || 0) -
                                editingThought.content.length}{" "}
                              characters remaining in total
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                    <DialogFooter className="flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEditingThought(null)
                          setIsEditDialogOpen(false)
                        }}
                        className="rounded-full bg-background/50 w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleEditThought}
                        className="rounded-full bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                        disabled={
                          !editingThought?.title ||
                          !editingThought?.content ||
                          editingThought?.content.length > MAX_THOUGHT_CHARS
                        }
                      >
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteThought(thought.id)}
                  className="bg-red-100 hover:bg-red-200 text-red-600 rounded-full w-full sm:w-auto"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}