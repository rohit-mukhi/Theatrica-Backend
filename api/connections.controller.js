import ConnectionDAO from '../dao/ConnectionDAO.js'
import UserDAO from '../dao/UserDAO.js'

export default class ConnectionController {
    static async apiSendRequest(req, res) {
        try {
            const from = req.user.username
            const to = req.params.username
            if (from === to) return res.status(400).json({ success: false, message: "Can't connect with yourself" })
            const result = await ConnectionDAO.sendRequest(from, to)
            if (result.error) return res.status(400).json({ success: false, message: result.error })
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiAcceptRequest(req, res) {
        try {
            const to = req.user.username
            const from = req.params.username
            const result = await ConnectionDAO.acceptRequest(from, to)
            if (result.error) return res.status(404).json({ success: false, message: result.error })
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiRejectRequest(req, res) {
        try {
            const to = req.user.username
            const from = req.params.username
            await ConnectionDAO.rejectRequest(from, to)
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetStatus(req, res) {
        try {
            const viewer = req.user.username
            const target = req.params.username
            // If viewer is blocked by target, return none (privacy)
            const blocked = await ConnectionDAO.isBlocked(viewer, target)
            if (blocked) return res.json({ status: 'none' })
            const status = await ConnectionDAO.getStatus(viewer, target)
            res.json(status)
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetRequests(req, res) {
        try {
            const username = req.user.username
            const requests = await ConnectionDAO.getPendingRequests(username)
            // Enrich with profile pics
            const senders = requests.map(r => r.from)
            const profiles = await UserDAO.getUsersByUsernames(senders)
            const picMap = {}
            for (const p of profiles) picMap[p.username] = p.profilePic
            const enriched = requests.map(r => ({ ...r, profilePic: picMap[r.from] ?? null }))
            res.json(enriched)
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetFriends(req, res) {
        try {
            const username = req.user.username
            const friends = await ConnectionDAO.getFriends(username)
            const profiles = await UserDAO.getUsersByUsernames(friends)
            res.json(profiles)
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiRemoveFriend(req, res) {
        try {
            const userA = req.user.username
            const userB = req.params.username
            await ConnectionDAO.removeFriend(userA, userB)
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiBlock(req, res) {
        try {
            const blocker = req.user.username
            const blocked = req.params.username
            await ConnectionDAO.blockUser(blocker, blocked)
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiUnblock(req, res) {
        try {
            const blocker = req.user.username
            const blocked = req.params.username
            await ConnectionDAO.unblockUser(blocker, blocked)
            res.json({ success: true })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }

    static async apiGetBlocked(req, res) {
        try {
            const username = req.user.username
            const blocked = await ConnectionDAO.getBlockedUsers(username)
            res.json({ blocked })
        } catch (e) { res.status(500).json({ success: false, message: e.message }) }
    }
}
