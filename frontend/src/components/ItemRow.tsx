
import React, { useState, memo } from 'react';
import { Item, Column } from '@monday-clone/shared';
import { useMutation } from '@tanstack/react-query';

interface ItemRowProps {
  item: Item;
  columns: Column[];
  level: number;
  itemIndex: number;
  renderCell: (item: Item, column: Column) => React.ReactNode;
  editingCell: { itemId: string; columnId: string } | null;
  setEditingCell: (cell: { itemId: string; columnId: string } | null) => void;
  editValue: any;
  setEditValue: (value: any) => void;
  updateItemMutation: any;
  setSelectedItemId: (id: string | null) => void;
  createSubItemMutation: any;
}

const ItemRow: React.FC<ItemRowProps> = memo(({
  item,
  columns,
  level,
  itemIndex,
  renderCell,
  editingCell,
  setEditingCell,
  editValue,
  setEditValue,
  updateItemMutation,
  setSelectedItemId,
  createSubItemMutation,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAddSubitem, setShowAddSubitem] = useState(false);
  const [newSubitemName, setNewSubitemName] = useState('');

  const handleAddSubitem = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubitemName.trim()) {
      createSubItemMutation.mutate({
        parentId: item.id,
        groupId: item.groupId,
        name: newSubitemName,
      });
      setNewSubitemName('');
      setShowAddSubitem(false);
    }
  };

  return (
    <>
      <tr className="border-b border-monday-border/30 dark:border-gray-700/50 hover:bg-monday-primaryLight/5 dark:hover:bg-gray-800/30 transition-all duration-150 group/row">
        <td
          className="px-6 py-3 sticky left-0 bg-white dark:bg-monday-darkLight z-10 border-r border-monday-border/20 dark:border-gray-700/30 group-hover/row:bg-monday-primaryLight/5 dark:group-hover/row:bg-gray-800/30 transition-colors"
        >
          <div className="flex items-center space-x-2 group/item" style={{ paddingLeft: `${level * 40}px` }}>
            <div className="flex items-center gap-1">
              {item.subitems && item.subitems.length > 0 && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              {level > 0 && !item.subitems?.length && <div className="w-5" />}
              {level > 0 && (
                <svg className="w-3 h-3 text-gray-400 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
               <div className="flex-shrink-0 w-6 h-6 rounded bg-gradient-to-br from-monday-blue/20 to-monday-purple/20 dark:from-monday-blue/10 dark:to-monday-purple/10 flex items-center justify-center text-xs font-bold text-monday-blue dark:text-monday-primary">
                {itemIndex + 1}
              </div>
            </div>
            <div
              onClick={() => {
                setEditingCell({ itemId: item.id, columnId: 'name' })
                setEditValue(item.name)
              }}
              className="flex-1 font-medium text-monday-text dark:text-white cursor-pointer hover:bg-monday-primaryLight/20 dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
            >
              {editingCell?.itemId === item.id && editingCell?.columnId === 'name' ? (
                <input
                  type="text"
                  value={editValue ?? item.name}
                  onChange={(e) => setEditValue(e.target.value)}
                  onBlur={() => {
                    updateItemMutation.mutate({
                      itemId: item.id,
                      updates: { name: editValue },
                    })
                    setEditingCell(null)
                    setEditValue(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      updateItemMutation.mutate({
                        itemId: item.id,
                        updates: { name: editValue },
                      })
                      setEditingCell(null)
                      setEditValue(null)
                    }
                    if (e.key === 'Escape') {
                      setEditingCell(null)
                      setEditValue(null)
                    }
                  }}
                  className="w-full px-3 py-2 text-base border-2 border-monday-primary rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-monday-primary/20 text-monday-text dark:bg-monday-dark dark:text-white"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: '14px' }}
                />
              ) : (
                <span
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedItemId(item.id)
                  }}
                  className="hover:text-monday-primary dark:hover:text-monday-primary transition-colors cursor-pointer"
                >
                  {item.name}
                </span>
              )}
            </div>
            <button
                onClick={() => setShowAddSubitem(true)}
                className="opacity-0 group-hover/item:opacity-100 p-1.5 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary hover:bg-monday-background dark:hover:bg-gray-700 rounded transition-all hover:scale-110"
                title="Add subitem"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedItemId(item.id)
              }}
              className="opacity-0 group-hover/item:opacity-100 p-1.5 text-monday-textLight dark:text-gray-400 hover:text-monday-primary dark:hover:text-monday-primary hover:bg-monday-background dark:hover:bg-gray-700 rounded transition-all hover:scale-110"
              title="View item details"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        </td>
        {columns.map((column) => (
          <td key={column.id} className="py-3">
            {renderCell(item, column)}
          </td>
        ))}
      </tr>
      {isExpanded && item.subitems?.map((subitem, subitemIndex) => (
        <ItemRow
          key={subitem.id}
          item={subitem}
          columns={columns}
          level={level + 1}
          itemIndex={subitemIndex}
          renderCell={renderCell}
          editingCell={editingCell}
          setEditingCell={setEditingCell}
          editValue={editValue}
          setEditValue={setEditValue}
          updateItemMutation={updateItemMutation}
          setSelectedItemId={setSelectedItemId}
          createSubItemMutation={createSubItemMutation}
        />
      ))}
      {showAddSubitem && (
        <tr>
          <td colSpan={columns.length + 1}>
            <form onSubmit={handleAddSubitem} className="flex items-center space-x-2 p-2" style={{ paddingLeft: `${(level + 1) * 40 + 24}px` }}>
              <input
                type="text"
                value={newSubitemName}
                onChange={(e) => setNewSubitemName(e.target.value)}
                placeholder="Enter subitem name..."
                className="flex-1 px-3 py-2 text-sm border-2 border-monday-primary rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-monday-primary/20 text-monday-text dark:bg-monday-dark dark:text-white"
                autoFocus
                onBlur={() => {
                  if(!newSubitemName.trim()) setShowAddSubitem(false);
                }}
              />
              <button type="submit" className="px-3 py-2 bg-monday-primary text-white rounded-lg text-sm">Add</button>
              <button type="button" onClick={() => setShowAddSubitem(false)} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg text-sm">Cancel</button>
            </form>
          </td>
        </tr>
      )}
    </>
  );
});

ItemRow.displayName = 'ItemRow';

export default ItemRow;
