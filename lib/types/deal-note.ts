export type DealNote = {
  id: string
  authorId: string | null
  author: string
  text: string
  timestamp: string
  updatedAt: string
  canEdit: boolean
}
