let connections
let users

export default class ConnectionDAO {
    static async injectDB(client) {
        connections = client.db('theatrica').collection('connections')
        users = client.db('user_records').collection('user_records')
        // Ensure unique index so duplicate requests are impossible
        await connections.createIndex({ from: 1, to: 1 }, { unique: true })
    }

    // ── FRIEND REQUESTS ──

    static async sendRequest(from, to) {
        try {
            // Check if target has blocked sender
            const target = await users.findOne({ username: to }, { projection: { blockedUsers: 1 } })
            if (target?.blockedUsers?.includes(from)) return { error: 'User not found' }
            // Check if sender is blocked by target (same check, different wording for safety)
            const sender = await users.findOne({ username: from }, { projection: { blockedUsers: 1 } })
            if (sender?.blockedUsers?.includes(to)) return { error: 'User not found' }

            await connections.insertOne({ from, to, status: 'pending', createdAt: new Date() })
            return { success: true }
        } catch (e) {
            if (e.code === 11000) return { error: 'Request already exists' }
            throw e
        }
    }

    static async acceptRequest(from, to) {
        try {
            const result = await connections.updateOne(
                { from, to, status: 'pending' },
                { $set: { status: 'accepted', acceptedAt: new Date() } }
            )
            return result.modifiedCount > 0 ? { success: true } : { error: 'Request not found' }
        } catch (e) { throw e }
    }

    static async rejectRequest(from, to) {
        try {
            await connections.deleteOne({ from, to, status: 'pending' })
            return { success: true }
        } catch (e) { throw e }
    }

    // Returns the connection status between two users from the perspective of `viewer`
    static async getStatus(userA, userB) {
        try {
            const conn = await connections.findOne({
                $or: [{ from: userA, to: userB }, { from: userB, to: userA }]
            })
            if (!conn) return { status: 'none' }
            return {
                status: conn.status,           // 'pending' | 'accepted'
                direction: conn.from === userA ? 'sent' : 'received'
            }
        } catch (e) { throw e }
    }

    static async getPendingRequests(username) {
        try {
            return await connections.find({ to: username, status: 'pending' }).toArray()
        } catch (e) { throw e }
    }

    static async getFriends(username) {
        try {
            const docs = await connections.find({
                $or: [{ from: username }, { to: username }],
                status: 'accepted'
            }).toArray()
            return docs.map(d => d.from === username ? d.to : d.from)
        } catch (e) { throw e }
    }

    static async removeFriend(userA, userB) {
        try {
            await connections.deleteOne({
                $or: [{ from: userA, to: userB }, { from: userB, to: userA }]
            })
            return { success: true }
        } catch (e) { throw e }
    }

    // ── BLOCKING ──

    static async blockUser(blocker, blocked) {
        try {
            // Remove any existing connection
            await connections.deleteOne({
                $or: [{ from: blocker, to: blocked }, { from: blocked, to: blocker }]
            })
            await users.updateOne({ username: blocker }, { $addToSet: { blockedUsers: blocked } })
            return { success: true }
        } catch (e) { throw e }
    }

    static async unblockUser(blocker, blocked) {
        try {
            await users.updateOne({ username: blocker }, { $pull: { blockedUsers: blocked } })
            return { success: true }
        } catch (e) { throw e }
    }

    static async getBlockedUsers(username) {
        try {
            const user = await users.findOne({ username }, { projection: { blockedUsers: 1 } })
            return user?.blockedUsers ?? []
        } catch (e) { throw e }
    }

    static async isBlocked(viewer, target) {
        try {
            const targetUser = await users.findOne({ username: target }, { projection: { blockedUsers: 1 } })
            return targetUser?.blockedUsers?.includes(viewer) ?? false
        } catch (e) { throw e }
    }
}
