import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../services/api'
import { useToast } from '../contexts/ToastContext'
import AddMemberModal from '../components/AddMemberModal'
import AddBoardModal from '../components/AddBoardModal'
import EditTeamModal from '../components/EditTeamModal'

// TODO: Replace with actual types from a types file
type User = {
  id: string
  name: string
  email: string
  avatar?: string
}

type TeamMember = {
  id: string
  role: 'OWNER' | 'MEMBER'
  user: User
}

type Board = {
  id:string
  name: string
}

type Team = {
  id: string
  name: string
  description?: string
  members: TeamMember[]
  boards: { board: Board }[]
}

const TeamSettingsPage = () => {
  const { teamId } = useParams<{ teamId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAddBoardModal, setShowAddBoardModal] = useState(false)
  const [showEditTeamModal, setShowEditTeamModal] = useState(false)

  const { data: team, isLoading, isError } = useQuery<Team>({
    queryKey: ['team', teamId],
    queryFn: async () => {
      const response = await api.get(`/teams/${teamId}`)
      return response.data.data
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/teams/${teamId}/members/${memberId}`)
    },
    onSuccess: () => {
      showToast('Member removed successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to remove member', 'error')
    },
  })

  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) => {
      await api.put(`/teams/${teamId}/members/${memberId}`, { role })
    },
    onSuccess: () => {
      showToast('Member role updated', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to update role', 'error')
    },
  })

  const removeBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/teams/${teamId}/boards/${boardId}`)
    },
    onSuccess: () => {
      showToast('Board removed successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['team', teamId] })
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to remove board', 'error')
    }
  })

  const deleteTeamMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/teams/${teamId}`)
    },
    onSuccess: () => {
      showToast('Team deleted successfully', 'success')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      navigate('/teams')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to delete team', 'error')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-primary"></div>
      </div>
    )
  }

  if (isError || !team) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <h2 className="text-2xl font-bold mb-2">Could not find team</h2>
        <p className="text-gray-500 mb-4">The team you are looking for does not exist or you do not have permission to view it.</p>
        <button onClick={() => navigate('/teams')} className="px-4 py-2 bg-monday-primary text-white rounded-md">
          Back to Teams
        </button>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full bg-monday-background dark:bg-monday-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-white dark:bg-monday-darkLight border-r border-monday-border dark:border-gray-700 flex flex-col shadow-lg">
        <div className="p-6 border-b border-monday-border dark:border-gray-700">
          <button
            onClick={() => navigate('/teams')}
            className="flex items-center space-x-2 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary transition-all group"
          >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Teams</span>
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            {/* Can add navigation links here */}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex items-center justify-between px-6 flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-monday-text dark:text-white">{team.name}</h1>
            <p className="text-sm text-monday-textLight dark:text-gray-400">{team.description}</p>
          </div>
          <div>
            <button onClick={() => setShowEditTeamModal(true)} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-black dark:text-white rounded-md">
                Edit Team
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md ml-4">
                Delete Team
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {/* Members Section */}
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Members ({team.members.length})</h2>
              <button onClick={() => setShowAddMemberModal(true)} className="px-4 py-2 bg-monday-primary text-white rounded-md">Add Member</button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {team.members.map(member => (
                <li key={member.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <img className="h-10 w-10 rounded-full" src={member.user.avatar || `https://ui-avatars.com/api/?name=${member.user.name}`} alt="" />
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{member.user.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <select
                          value={member.role}
                          onChange={(e) => updateRoleMutation.mutate({ memberId: member.id, role: e.target.value })}
                          className="mr-4 bg-transparent"
                        >
                            <option value="OWNER">Owner</option>
                            <option value="MEMBER">Member</option>
                        </select>
                        
                        {team.members.filter(m => m.role === 'OWNER').length > 1 || member.role !== 'OWNER' ? (
                            <button onClick={() => removeMemberMutation.mutate(member.id)} className="text-red-500 hover:text-red-700">Remove</button>
                        ) : (
                            <button className="text-gray-400 cursor-not-allowed" disabled>Remove</button>
                        )}
                    </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Boards Section */}
          <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday p-6">
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Boards ({team.boards.length})</h2>
                <button onClick={() => setShowAddBoardModal(true)} className="px-4 py-2 bg-monday-primary text-white rounded-md">Add Board</button>
            </div>
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {team.boards.map(({ board }) => (
                    <li key={board.id} className="py-4 flex items-center justify-between">
                        <p className="font-medium">{board.name}</p>
                        <button onClick={() => removeBoardMutation.mutate(board.id)} className="text-red-500 hover:text-red-700">Remove</button>
                    </li>
                ))}
            </ul>
          </div>
        </main>
      </div>

      {showAddMemberModal && <AddMemberModal onClose={() => setShowAddMemberModal(false)} teamId={teamId || ''} />}
      {showAddBoardModal && <AddBoardModal onClose={() => setShowAddBoardModal(false)} teamId={teamId || ''} />}
      {showEditTeamModal && team && <EditTeamModal onClose={() => setShowEditTeamModal(false)} team={team} />}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
         <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowDeleteModal(false)}>
         <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
           <h2 className="text-lg font-bold">Are you sure?</h2>
           <p className="my-4">Do you really want to delete the team "{team.name}"? This action cannot be undone.</p>
           <div className="flex justify-end space-x-4">
             <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 rounded-md border">Cancel</button>
             <button
               onClick={() => deleteTeamMutation.mutate()}
               disabled={deleteTeamMutation.isPending}
               className="px-4 py-2 rounded-md bg-red-500 text-white disabled:opacity-50"
             >
               {deleteTeamMutation.isPending ? 'Deleting...' : 'Delete'}
             </button>
           </div>
         </div>
       </div>
      )}
    </div>
  )
}

export default TeamSettingsPage
