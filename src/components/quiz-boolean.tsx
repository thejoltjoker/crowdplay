import React from 'react'

export interface QuizBooleanProps {}

const QuizBoolean: React.FC<QuizBooleanProps> = ({}) => {
  return (
    <div className="flex flex-col gap-4">
      <button className="btn btn-primary">Yes</button>
      <button className="btn btn-secondary">No</button>
    </div>
  )
}

export default QuizBoolean
