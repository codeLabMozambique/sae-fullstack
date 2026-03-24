import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <div
      className={g-white rounded-lg shadow p-4 }
      {...props}
    >
      {children}
    </div>
  )
}
