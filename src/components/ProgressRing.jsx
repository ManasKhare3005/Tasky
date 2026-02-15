import './ProgressRing.css'

const ProgressRing = ({ percent }) => {
  const circumference = 2 * Math.PI * 80
  const offset = circumference - (percent / 100) * circumference

  return (
    <div className="progress-ring-container">
      <svg className="progress-ring" width="180" height="180">
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00ff88"/>
            <stop offset="100%" stopColor="#00ccff"/>
          </linearGradient>
        </defs>
        <circle className="progress-ring-bg" cx="90" cy="90" r="80"/>
        <circle 
          className="progress-ring-fill" 
          cx="90" 
          cy="90" 
          r="80"
          style={{ strokeDashoffset: offset }}
        />
      </svg>
      <div className="progress-center">
        <div className="progress-percent">{percent}%</div>
        <div className="progress-label">Complete</div>
      </div>
    </div>
  )
}

export default ProgressRing
