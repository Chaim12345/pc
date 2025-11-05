import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'

type Board = {
  id: string
  name: string
}

type Props = {
  teamId: string
  onClose: () => void
}

const AddBoardModal = ({ teamId, onClose }: Props) => {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null)

  // In a real app, you might want to only list boards not already in the team
  const { data: boards } = useQuery<Board[]>({
    queryKey: ['boards'],
    queryFn: async () => {
      // Assuming a /boards endpoint exists to list all boards in the org
      const response = await api.get('/boards')
      return response.data.data
    },
  })

  const addBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await api.post(`/teams/${teamId}/boards`, { boardId })
    },
    onSuccess: () => {
      showToast('Board added successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
      onClose()
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add board', 'error')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBoard) return
    addBoardMutation.mutate(selectedBoard.id)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">Add Board</h2>
        <form onSubmit={handleSubmit}>
          <select 
            onChange={(e) => setSelectedBoard(boards?.find(b => b.id === e.target.value) || null)} 
            className="w-full p-2 border rounded-md mb-4"
          >
            <option>Select a board</option>
            {boards?.map(board => (
              <option key={board.id} value={board.id}>{board.name}</option>
            ))}
          </select>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md border">Cancel</button>
            <button type="submit" disabled={!selectedBoard || addBoardMutation.isPending} className="px-4 py-2 rounded-md bg-monday-primary text-white disabled:opacity-50">
              {addBoardMutation.isPending ? 'Adding...' : 'Add Board'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddBoardModal
