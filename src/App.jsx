import React, { useState, useEffect, useMemo } from 'react'
import timetableData from './timetable.json'
import './App.css'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // format time for display
  const formattedCurrentTime = useMemo(() => {
    return currentTime.toLocaleTimeString('zh-TW', { hour12: false })
  }, [currentTime])

  const dayOfWeek = currentTime.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 // 0 is Sunday, 6 is Saturday
  const activeTimetable = isWeekend ? timetableData.schedule.weekend : timetableData.schedule.weekday

  // find nearby trains
  const currentTotalMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const currentSeconds = currentTime.getSeconds()

  const travelTimeMinutes = 13 // 普通車 A1 到 A4 大約 13 分鐘

  const upcomingTrains = useMemo(() => {
    return activeTimetable
      .map(timeStr => {
        const [h, m] = timeStr.split(':').map(Number)
        const totalMinutes = h * 60 + m
        const arrivalTotalMinutes = totalMinutes + travelTimeMinutes
        const arrH = Math.floor(arrivalTotalMinutes / 60) % 24
        const arrM = arrivalTotalMinutes % 60
        const arrivalTimeStr = `${String(arrH).padStart(2, '0')}:${String(arrM).padStart(2, '0')}`

        return {
          original: timeStr,
          arrivalTime: arrivalTimeStr,
          totalMinutes: totalMinutes
        }
      })
      .filter(t => t.totalMinutes >= currentTotalMinutes)
      .sort((a, b) => a.totalMinutes - b.totalMinutes)
  }, [activeTimetable, currentTotalMinutes])

  const nextTrain = upcomingTrains[0]
  const followingTrains = upcomingTrains.slice(1, 5)

  const getCountdown = (train) => {
    if (!train) return null
    let diff = train.totalMinutes - currentTotalMinutes

    // account for the fact that if seconds > 0, we're effectively 1 minute closer to the deadline
    // but standard countdown usually shows "X min remaining"
    // here we'll do: (diff - 1) min and (60 - currentSeconds) sec
    if (diff === 0 && currentSeconds > 0) return "已發車"

    if (currentSeconds > 0) {
      return {
        minutes: diff - 1,
        seconds: 60 - currentSeconds
      }
    }
    return {
      minutes: diff,
      seconds: 0
    }
  }

  const countdown = getCountdown(nextTrain)

  return (
    <div className="container">
      <header className="header animate-fade-in">
        <div className="line-icon">A</div>
        <div className="title-group">
          <h1>機場捷運時刻表</h1>
          <p>{timetableData.route.from} ➜ {timetableData.route.to}</p>
        </div>
      </header>

      <div className="time-display animate-fade-in">
        <span className="current-label">當前時間</span>
        <span className="current-clock">{formattedCurrentTime}</span>
        {isWeekend && <span className="day-badge">假日時刻</span>}
        {!isWeekend && <span className="day-badge weekday">平日時刻</span>}
      </div>

      <main className="main-content">
        {nextTrain ? (
          <div className="next-train-card glass animate-fade-in">
            <div className="card-header">
              <span className="badge regular">普通車</span>
              <span className="dest">往 {timetableData.destination}</span>
            </div>
            <div className="train-info">
              <div className="time-display-group">
                <div className="time-big">{nextTrain.original}</div>
                <div className="arrival-time">預計 <span>{nextTrain.arrivalTime}</span> 抵達</div>
              </div>
              <div className="countdown-group">
                {typeof countdown === 'string' ? (
                  <span className="departing">{countdown}</span>
                ) : (
                  <>
                    <span className="countdown-value">{countdown.minutes}</span>
                    <span className="countdown-unit">分</span>
                    <span className="countdown-value">{countdown.seconds.toString().padStart(2, '0')}</span>
                    <span className="countdown-unit">秒後出發</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="no-train glass animate-fade-in">今日已無班次</div>
        )}

        {followingTrains.length > 0 && (
          <section className="following-section animate-fade-in">
            <h3>後續班次</h3>
            <div className="train-list">
              {followingTrains.map((train, idx) => (
                <div key={idx} className="train-item glass">
                  <div className="item-info-col">
                    <span className="item-time">{train.original} (往環北)</span>
                    <span className="item-arrival">抵達副都心 {train.arrivalTime}</span>
                  </div>
                  <span className="item-diff">T+{train.totalMinutes - currentTotalMinutes} min</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer-info animate-fade-in">
        <p>※ 僅供參考，實際請依官網與現場公告為準。</p>
      </footer>
    </div>
  )
}

export default App
