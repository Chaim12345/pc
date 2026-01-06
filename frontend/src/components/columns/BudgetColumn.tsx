import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../../services/api'

interface Props {
  itemId: string
  columnId: string
  value?: any
  boardId: string
}

export default function BudgetColumn({ itemId, columnId, value, boardId }: Props) {
  const [isEditing, setIsEditing] = useState(false)
  const [budgetValue, setBudgetValue] = useState(value?.budget || 0)
  const [actualValue, setActualValue] = useState(value?.actual || 0)
  const [currency, setCurrency] = useState(value?.currency || 'USD')
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (newValue: any) => {
      await api.put(`/column-values/${itemId}/${columnId}`, { value: newValue })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', boardId] })
      setIsEditing(false)
    }
  })

  const handleSave = () => {
    updateMutation.mutate({
      budget: parseFloat(budgetValue) || 0,
      actual: parseFloat(actualValue) || 0,
      currency
    })
  }

  const budget = parseFloat(value?.budget) || 0
  const actual = parseFloat(value?.actual) || 0
  const remaining = budget - actual
  const percentage = budget > 0 ? (actual / budget) * 100 : 0
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency

  if (isEditing) {
    return (
      <div className="min-w-[200px] p-2 space-y-2">
        <div className="flex items-center space-x-2">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="USD">$ USD</option>
            <option value="EUR">€ EUR</option>
            <option value="GBP">£ GBP</option>
            <option value="JPY">¥ JPY</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Budget:</label>
          <input
            type="number"
            value={budgetValue}
            onChange={(e) => setBudgetValue(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div>
          <label className="text-xs text-gray-600 dark:text-gray-400">Actual:</label>
          <input
            type="number"
            value={actualValue}
            onChange={(e) => setActualValue(e.target.value)}
            className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            placeholder="0.00"
            step="0.01"
          />
        </div>
        <div className="flex space-x-1">
          <button
            onClick={handleSave}
            className="flex-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="flex-1 px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
          >
            Cancel
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className="min-w-[180px] px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors"
    >
      {budget > 0 || actual > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Budget:</span>
            <span className="font-semibold text-gray-900 dark:text-white">
              {currencySymbol}{budget.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Actual:</span>
            <span className={`font-semibold ${
              actual > budget ? 'text-red-600' : 'text-green-600'
            }`}>
              {currencySymbol}{actual.toFixed(2)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage > 100 ? 'bg-red-600' : percentage > 80 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-500">{percentage.toFixed(0)}% used</span>
            <span className={`font-medium ${
              remaining < 0 ? 'text-red-600' : 'text-green-600'
            }`}>
              {currencySymbol}{Math.abs(remaining).toFixed(2)} {remaining < 0 ? 'over' : 'left'}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-gray-400 dark:text-gray-600 text-sm">
          Click to set budget
        </div>
      )}
    </div>
  )
}








