'use client'

import { useState, useRef, useEffect } from 'react'

export default function SuburbSearch({ 
  suburbs, 
  defaultValue = '' 
}: { 
  suburbs: { id: string, name: string, city: string }[],
  defaultValue?: string 
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(defaultValue)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Find the selected suburb to display its name in the input
  const selectedSuburb = suburbs.find(s => s.id === selectedId)
  const displayValue = isOpen ? query : (selectedSuburb ? `${selectedSuburb.name} (${selectedSuburb.city})` : '')

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setQuery('')
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredSuburbs = query === '' 
    ? suburbs 
    : suburbs.filter((sub) => 
        sub.name.toLowerCase().includes(query.toLowerCase()) || 
        sub.city.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10) // Limit to 10 results for performance

  return (
    <div ref={wrapperRef} className="relative flex-1">
      {/* Hidden input ensures the form submits the selected Suburb ID */}
      <input type="hidden" name="suburb" value={selectedId} />
      
      <input
        type="text"
        placeholder="Search Suburb..."
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setIsOpen(true)
          if (e.target.value === '') setSelectedId('') // Clear selection if input is cleared
        }}
        onFocus={() => setIsOpen(true)}
        className="w-full border border-gray-300 p-3 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {isOpen && (
        <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {filteredSuburbs.length === 0 ? (
            <li className="p-3 text-gray-500 text-sm">No suburbs found.</li>
          ) : (
            filteredSuburbs.map((sub) => (
              <li 
                key={sub.id}
                onClick={() => {
                  setSelectedId(sub.id)
                  setIsOpen(false)
                  setQuery('')
                }}
                className="p-3 hover:bg-blue-50 cursor-pointer text-sm text-gray-700"
              >
                {sub.name} <span className="text-gray-400">({sub.city})</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  )
}