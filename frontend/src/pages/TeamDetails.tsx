import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '../contexts/ToastContext'
import { api } from '../services/api'
import AddTeamMemberModal from '../components/AddTeamMemberModal'
import AddBoardToTeamModal from '../components/AddBoardToTeamModal'

export default function TeamDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [showAddBoardModal, setShowAddBoardModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'members' | 'boards'>('members')

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: async () => {
      const response = await api.get(`/teams/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })

  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const response = await api.post(`/teams/${id}/members`, { userId, role })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      showToast('Member added successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add member', 'error')
    },
  })

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      await api.delete(`/teams/${id}/members/${memberId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      showToast('Member removed successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to remove member', 'error')
    },
  })

  const addBoardMutation = useMutation({
    mutationFn: async ({ boardId, access }: { boardId: string; access: string }) => {
      const response = await api.post(`/teams/${id}/boards`, { boardId, access })
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      showToast('Board added successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to add board', 'error')
    },
  })

  const removeBoardMutation = useMutation({
    mutationFn: async (boardId: string) => {
      await api.delete(`/teams/${id}/boards/${boardId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      showToast('Board removed successfully!', 'success')
    },
    onError: (error: any) => {
      showToast(error.response?.data?.error || 'Failed to remove board', 'error')
    },
  })

  const handleAddMember = (userId: string, role: string) => {
    addMemberMutation.mutate({ userId, role })
  }

  const handleRemoveMember = (memberId: string) => {
    if (window.confirm('Are you sure you want to remove this member?')) {
      removeMemberMutation.mutate(memberId)
    }
  }

  const handleAddBoard = (boardId: string, access: string) => {
    addBoardMutation.mutate({ boardId, access })
  }

  const handleRemoveBoard = (boardId: string) => {
    if (window.confirm('Are you sure you want to remove this board from the team?')) {
      removeBoardMutation.mutate(boardId)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-monday-blue',
      'bg-monday-purple',
      'bg-monday-green',
      'bg-monday-orange',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    const index = name.charCodeAt(0) % colors.length
    return colors[index]
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'ADMIN':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-monday-primary"></div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-monday-text dark:text-white mb-2">Team not found</h2>
          <button
            onClick={() => navigate('/teams')}
            className="text-monday-primary hover:text-monday-primaryHover"
          >
            Back to Teams
          </button>
        </div>
      </div>
    )
  }

  const existingMemberIds = team.members?.map((m: any) => m.userId) || []

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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-monday-darkLight border-b border-monday-border dark:border-gray-700 flex-shrink-0 shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-monday-text dark:text-white">{team.name}</h1>
              {team.description && (
                <p className="text-sm text-monday-textLight dark:text-gray-400">{team.description}</p>
              )}
            </div>
            <button
              onClick={() => activeTab === 'members' ? setShowAddMemberModal(true) : setShowAddBoardModal(true)}
              className="px-5 py-2.5 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium flex items-center space-x-2 transition-all hover:scale-105 hover:shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>{activeTab === 'members' ? 'Add Member' : 'Add Board'}</span>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'members'
                  ? 'text-monday-primary border-b-2 border-monday-primary'
                  : 'text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span>Members ({team.members?.length || 0})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('boards')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'boards'
                  ? 'text-monday-primary border-b-2 border-monday-primary'
                  : 'text-monday-textLight dark:text-gray-400 hover:text-monday-text dark:hover:text-white'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Boards ({team.boards?.length || 0})</span>
              </div>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {activeTab === 'members' ? (
            <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {team.members && team.members.length > 0 ? (
                  team.members.map((member: any) => (
                    <div
                      key={member.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-full ${getAvatarColor(member.user.name)} flex items-center justify-center text-white text-sm font-bold`}>
                          {getInitials(member.user.name)}
                        </div>
                        <div>
                          <div className="font-medium text-monday-text dark:text-white">
                            {member.user.name}
                          </div>
                          <div className="text-sm text-monday-textLight dark:text-gray-400">
                            {member.user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                          {member.role}
                        </span>
                        {member.role !== 'OWNER' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            disabled={removeMemberMutation.isPending}
                            className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-monday-textLight dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="text-lg font-bold text-monday-text dark:text-white mb-2">No members yet</h3>
                    <p className="text-monday-textLight dark:text-gray-400 mb-4">Add members to start collaborating</p>
                    <button
                      onClick={() => setShowAddMemberModal(true)}
                      className="px-6 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add First Member</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-monday-darkLight rounded-xl shadow-monday overflow-hidden">
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {team.boards && team.boards.length > 0 ? (
                  team.boards.map((boardTeam: any) => (
                    <div
                      key={boardTeam.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-monday-primary to-monday-purple flex items-center justify-center text-white shadow-md">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-monday-text dark:text-white">
                            {boardTeam.board?.name || 'Untitled Board'}
                          </div>
                          {boardTeam.board?.description && (
                            <div className="text-sm text-monday-textLight dark:text-gray-400 line-clamp-1">
                              {boardTeam.board.description}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          boardTeam.access === 'ADMIN' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
                          boardTeam.access === 'EDIT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                        }`}>
                          {boardTeam.access}
                        </span>
                        <button
                          onClick={() => navigate(`/board/${boardTeam.boardId}`)}
                          className="text-monday-primary hover:text-monday-primaryHover"
                          title="Open board"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveBoard(boardTeam.boardId)}
                          disabled={removeBoardMutation.isPending}
                          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <svg className="w-16 h-16 mx-auto text-monday-textLight dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="text-lg font-bold text-monday-text dark:text-white mb-2">No boards yet</h3>
                    <p className="text-monday-textLight dark:text-gray-400 mb-4">Add boards to give this team access</p>
                    <button
                      onClick={() => setShowAddBoardModal(true)}
                      className="px-6 py-3 bg-monday-primary hover:bg-monday-primaryHover text-white rounded-lg font-medium flex items-center space-x-2 mx-auto transition-all hover:scale-105"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span>Add First Board</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <AddTeamMemberModal
          teamId={id!}
          existingMemberIds={existingMemberIds}
          onClose={() => setShowAddMemberModal(false)}
          onAddMember={handleAddMember}
        />
      )}

      {/* Add Board Modal */}
      {showAddBoardModal && (
        <AddBoardToTeamModal
          teamId={id!}
          existingBoardIds={team.boards?.map((b: any) => b.boardId) || []}
          onClose={() => setShowAddBoardModal(false)}
          onAddBoard={handleAddBoard}
        />
      )}
    </div>
  )
}

