import { WebSocketServer } from 'ws'
import jwt from 'jsonwebtoken'
import MessageDAO from '../dao/MessageDAO.js'
import ConnectionDAO from '../dao/ConnectionDAO.js'

// Map of username → WebSocket
const online = new Map()

export function createWsServer(server) {
    const wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
        let authedUser = null

        ws.on('message', async (raw) => {
            let msg
            try { msg = JSON.parse(raw) } catch { return }

            // ── AUTH ──
            if (msg.type === 'auth') {
                try {
                    const decoded = jwt.verify(msg.token, process.env.JWT_SECRET)
                    authedUser = decoded.username
                    online.set(authedUser, ws)
                    ws.send(JSON.stringify({ type: 'auth_ok', username: authedUser }))
                } catch {
                    ws.send(JSON.stringify({ type: 'auth_error' }))
                    ws.close()
                }
                return
            }

            if (!authedUser) { ws.close(); return }

            // ── SEND MESSAGE ──
            if (msg.type === 'message') {
                const { to, text } = msg
                if (!to || !text?.trim()) return

                // Must be friends
                const status = await ConnectionDAO.getStatus(authedUser, to)
                if (status.status !== 'accepted') {
                    ws.send(JSON.stringify({ type: 'error', message: 'Not connected' }))
                    return
                }

                // If recipient blocked sender, drop silently
                const blocked = await ConnectionDAO.isBlocked(authedUser, to)
                if (blocked) return

                const saved = await MessageDAO.saveMessage(authedUser, to, text.trim())
                const payload = JSON.stringify({ type: 'message', message: saved })

                // Deliver to recipient if online
                const recipientWs = online.get(to)
                if (recipientWs?.readyState === 1) recipientWs.send(payload)

                // Echo back to sender with saved _id
                ws.send(payload)
            }

            // ── TYPING INDICATOR ──
            if (msg.type === 'typing') {
                const recipientWs = online.get(msg.to)
                if (recipientWs?.readyState === 1) {
                    recipientWs.send(JSON.stringify({ type: 'typing', from: authedUser }))
                }
            }
        })

        ws.on('close', () => {
            if (authedUser) online.delete(authedUser)
        })
    })

    return wss
}

export function isOnline(username) {
    return online.has(username)
}
