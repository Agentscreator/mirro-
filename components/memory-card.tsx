"use client"

import { useState } from "react"
import { Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"

interface MemoryCardProps {
  memory: {
    id: number
    title: string
    content: string
    isPublic: boolean
    createdAt: string
  }
  onEdit: (memory: any) => void
  onDelete: (id: number) => void
}

export function MemoryCard({ memory, onEdit, onDelete }: MemoryCardProps) {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingMemory, setEditingMemory] = useState(memory)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const handleSaveEdit = () => {
    onEdit(editingMemory)
    setIsEditDialogOpen(false)
  }

  return (
    <Card className="border-0 shadow-md dark:bg-black dark:shadow-emerald-900/10">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{memory.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{formatDate(memory.createdAt)}</p>
          </div>
          <Badge variant={memory.isPublic ? "default" : "outline"}>{memory.isPublic ? "Public" : "Private"}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-line">{memory.content}</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[550px] dark:bg-black">
            <DialogHeader>
              <DialogTitle>Edit Memory</DialogTitle>
              <DialogDescription>Make changes to your memory.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingMemory.title}
                  onChange={(e) => setEditingMemory({ ...editingMemory, title: e.target.value })}
                  className="border-muted-foreground/20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-content">Content</Label>
                <Textarea
                  id="edit-content"
                  value={editingMemory.content}
                  onChange={(e) => setEditingMemory({ ...editingMemory, content: e.target.value })}
                  className="min-h-[150px] border-muted-foreground/20"
                />
                <div className="text-xs text-muted-foreground text-right">
                  {editingMemory.content.length} characters
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-public"
                  checked={editingMemory.isPublic}
                  onCheckedChange={(checked) => setEditingMemory({ ...editingMemory, isPublic: checked })}
                />
                <Label htmlFor="edit-public">Make this memory discoverable</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        <Button variant="destructive" size="sm" onClick={() => onDelete(memory.id)}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </Button>
      </CardFooter>
    </Card>
  )
}
