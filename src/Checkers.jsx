import React, { useState, useEffect } from 'react'
import './Checkers.css'

export default function CheckersLocal() {
  const SIZE = 8
  const [board, setBoard] = useState(() => initialBoard())
  const [turn, setTurn] = useState('B')
  const [selected, setSelected] = useState(null)
  const [legalMoves, setLegalMoves] = useState([])
  const [gameOver, setGameOver] = useState(null)
  const [winner, setWinner] = useState(null)
  const [showWinner, setShowWinner] = useState(false)

  function initialBoard() {
    const b = Array.from({ length: SIZE }, () => Array(SIZE).fill(null))
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((r + c) % 2 === 1) b[r][c] = { player: 'B', king: false }
      }
    }
    for (let r = SIZE - 3; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((r + c) % 2 === 1) b[r][c] = { player: 'W', king: false }
      }
    }
    return b
  }

  function inside(r, c) { return r >= 0 && r < SIZE && c >= 0 && c < SIZE }

  const DIRS = { B: [[1, -1], [1, 1]], W: [[-1, -1], [-1, 1]] }
  const KING_DIRS = [[1, -1], [1, 1], [-1, -1], [-1, 1]]

  function findAllCaptures(bd, player) {
    const res = []
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
      const p = bd[r][c]
      if (p && p.player === player) {
        const caps = getCapturesForPiece(bd, r, c, p.king)
        if (caps.length) res.push({ r, c, caps })
      }
    }
    return res
  }

  function getCapturesForPiece(bd, r, c, isKing) {
    const res = []
    const dirs = KING_DIRS
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc
      const r2 = r + 2 * dr, c2 = c + 2 * dc
      if (inside(r2, c2) && bd[r2][c2] === null) {
        const mid = bd[r1] && bd[r1][c1]
        if (mid && mid.player && mid.player !== bd[r][c].player) {
          res.push({ to: { r: r2, c: c2 }, captured: [{ r: r1, c: c1 }] })
        }
      }
    }
    return res
  }

  function getNonCaptureMoves(bd, r, c, isKing) {
    const res = []
    const dirs = isKing ? KING_DIRS : DIRS[bd[r][c].player]
    for (const [dr, dc] of dirs) {
      const r1 = r + dr, c1 = c + dc
      if (inside(r1, c1) && bd[r1][c1] === null) res.push({ to: { r: r1, c: c1 } })
    }
    return res
  }

  function getFurtherCaptures(bd, r, c) {
    const piece = bd[r][c]
    if (!piece) return []
    return getCapturesForPiece(bd, r, c, piece.king)
  }

  function checkGameOver(bd) {
    let blackPieces = 0
    let whitePieces = 0
    let blackMoves = 0
    let whiteMoves = 0

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const piece = bd[r][c]
        if (piece) {
          if (piece.player === 'B') {
            blackPieces++
            const captures = findAllCaptures(bd, 'B')
            const moves = getNonCaptureMoves(bd, r, c, piece.king)
            if (captures.length > 0 || moves.length > 0) blackMoves++
          } else {
            whitePieces++
            const captures = findAllCaptures(bd, 'W')
            const moves = getNonCaptureMoves(bd, r, c, piece.king)
            if (captures.length > 0 || moves.length > 0) whiteMoves++
          }
        }
      }
    }

    if (blackPieces === 0 || blackMoves === 0) {
      setWinner('W')
      setGameOver(true)
      setTimeout(() => setShowWinner(true), 500)
      return true
    }
    if (whitePieces === 0 || whiteMoves === 0) {
      setWinner('B')
      setGameOver(true)
      setTimeout(() => setShowWinner(true), 500)
      return true
    }
    return false
  }

  function handleClick(r, c) {
    if (gameOver) return

    const cell = board[r][c]
    const move = legalMoves.find(m => m.to.r === r && m.to.c === c)
    if (move) { applyMove(move); return }

    if (cell && cell.player === turn) {
      const mustCapturePieces = findAllCaptures(board, turn).map(m => `${m.r},${m.c}`)
      if (mustCapturePieces.length && !mustCapturePieces.includes(`${r},${c}`)) {
        setSelected(null)
        setLegalMoves([])
        return
      }
      setSelected({ r, c })
      computeLegalMovesForSelection(r, c)
      return
    }

    setSelected(null)
    setLegalMoves([])
  }

  function computeLegalMovesForSelection(r, c) {
    const p = board[r][c]
    if (!p) return
    const allCaptures = findAllCaptures(board, turn)
    if (allCaptures.length) {
      const caps = getCapturesForPiece(board, r, c, p.king)
      const moves = caps.map(cap => ({ from: { r, c }, to: cap.to, captured: cap.captured, mustContinue: true }))
      setLegalMoves(moves)
    } else {
      const moves = getNonCaptureMoves(board, r, c, p.king).map(m => ({ from: { r, c }, to: m.to, captured: [] }))
      setLegalMoves(moves)
    }
  }

  function applyMove(move) {
    const newBoard = board.map(row => row.map(cell => cell ? { ...cell } : null))
    const { from, to, captured } = move
    const piece = newBoard[from.r][from.c]
    newBoard[from.r][from.c] = null
    newBoard[to.r][to.c] = piece

    if (captured && captured.length) {
      for (const cap of captured) newBoard[cap.r][cap.c] = null
    }

    if (!piece.king) {
      if (piece.player === 'B' && to.r === SIZE - 1) piece.king = true
      if (piece.player === 'W' && to.r === 0) piece.king = true
    }

    setBoard(newBoard)

    if (captured && captured.length) {
      const further = getFurtherCaptures(newBoard, to.r, to.c)
      if (further.length) {
        setSelected({ r: to.r, c: to.c })
        const moves = further.map(cap => ({ from: { r: to.r, c: to.c }, to: cap.to, captured: cap.captured, mustContinue: true }))
        setLegalMoves(moves)
        return
      }
    }

    setSelected(null)
    setLegalMoves([])
    
    if (!checkGameOver(newBoard)) {
      setTurn(turn === 'B' ? 'W' : 'B')
    }
  }

  function resetGame(startingPlayer = 'B') {
    setBoard(initialBoard())
    setTurn(startingPlayer)
    setSelected(null)
    setLegalMoves([])
    setGameOver(false)
    setWinner(null)
    setShowWinner(false)
  }

  function renderCell(r, c) {
    const dark = (r + c) % 2 === 1
    const piece = board[r][c]
    const isSelected = selected && selected.r === r && selected.c === c
    const isMoveTarget = legalMoves.some(m => m.to.r === r && m.to.c === c)
    const classes = `cell ${dark ? 'dark' : 'light'} ${isSelected ? 'selected' : ''} ${isMoveTarget ? 'target' : ''}`
    
    return (
      <div key={`${r}-${c}`} className={classes} onClick={() => handleClick(r, c)}>
        {piece && (
          <div className={`piece ${piece.player === 'B' ? 'black' : 'white'} ${piece.king ? 'king' : ''}`}>
            {piece.king && <div className="crown">♔</div>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="game-container">
      <div className="game-header">
        <h1>Warcaby</h1>
        <div className="game-info">
          <div className={`turn-indicator ${turn === 'B' ? 'black-turn' : 'white-turn'}`}>
            Ruch: {turn === 'B' ? 'Czarnych' : 'Białych'}
          </div>
        </div>
      </div>

      <div className="board-container">
        <div className="board">
          {Array.from({ length: SIZE }).map((_, r) => (
            <React.Fragment key={r}>
              {Array.from({ length: SIZE }).map((_, c) => renderCell(r, c))}
            </React.Fragment>
          ))}
        </div>
        
        {showWinner && (
          <div className={`winner-overlay ${winner === 'B' ? 'black-wins' : 'white-wins'}`}>
            <div className="winner-content">
              <h2>{winner === 'B' ? 'Czarne' : 'Białe'} wygrywają!</h2>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <div className="confetti"></div>
              <button onClick={() => resetGame()} className="play-again-btn">
                Zagraj ponownie
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="game-controls">
        <button onClick={() => resetGame('B')} className="control-btn black-start">
          Start czarnymi
        </button>
        <button onClick={() => resetGame('W')} className="control-btn white-start">
          Start białymi
        </button>
        <button onClick={() => resetGame(turn)} className="control-btn reset">
          Reset
        </button>
      </div>
    </div>
  )
}