import MessageDAO from '../dao/MessageDAO.js'
import ConnectionDAO from '../dao/ConnectionDAO.js'

export default class MessageController {
    static async apiGetConversation(req, res) {
        try {
            const me = req.user.username
            const other = req.params.username
            // Only friends can read each other's messages
            const status = await ConnectionDAO.getStatus(me, other)
            if (status.status !== 'accepted') {
                return res.status(403).json({ success: false, message: 'Not connected' })
            }
            const msgs = await MessageDAO.getConversation(me, other)
            await MessageDAO.markRead(other, me)
            res.json(msgs)
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetInbox(req, res) {
        try {
            const username = req.user.username
            const inbox = await MessageDAO.getInbox(username)
            const unread = await MessageDAO.getUnreadCounts(username)
            res.json({ inbox, unread })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetUnread(req, res) {
        try {
            const username = req.user.username
            const unread = await MessageDAO.getUnreadCounts(username)
            const total = Object.values(unread).reduce((s, n) => s + n, 0)
            res.json({ total, byUser: unread })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }
}
