export default function SidebarSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 px-3 py-2">
          <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
          <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}




