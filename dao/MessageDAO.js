let messages

export default class MessageDAO {
    static async injectDB(client) {
        messages = client.db('theatrica').collection('messages')
        await messages.createIndex({ from: 1, to: 1, createdAt: -1 })
    }

    static async saveMessage(from, to, text) {
        try {
            const doc = { from, to, text, createdAt: new Date(), read: false }
            const result = await messages.insertOne(doc)
            return { ...doc, _id: result.insertedId }
        } catch (e) { throw e }
    }

    // Returns full conversation between two users, oldest first
    static async getConversation(userA, userB, limit = 100) {
        try {
            const cursor = await messages.find({
                $or: [
                    { from: userA, to: userB },
                    { from: userB, to: userA }
                ]
            }).sort({ createdAt: 1 }).limit(limit)
            return cursor.toArray()
        } catch (e) { throw e }
    }

    // Mark all messages from `from` to `to` as read
    static async markRead(from, to) {
        try {
            await messages.updateMany({ from, to, read: false }, { $set: { read: true } })
        } catch (e) { throw e }
    }

    // Returns count of unread messages for a user across all conversations
    static async getUnreadCounts(username) {
        try {
            const pipeline = [
                { $match: { to: username, read: false } },
                { $group: { _id: '$from', count: { $sum: 1 } } }
            ]
            const result = await messages.aggregate(pipeline).toArray()
            const counts = {}
            for (const r of result) counts[r._id] = r.count
            return counts
        } catch (e) { throw e }
    }

    // Returns list of conversations (latest message per pair) for inbox
    static async getInbox(username) {
        try {
            const pipeline = [
                { $match: { $or: [{ from: username }, { to: username }] } },
                { $sort: { createdAt: -1 } },
                {
                    $group: {
                        _id: {
                            $cond: [{ $lt: ['$from', '$to'] },
                                { a: '$from', b: '$to' },
                                { a: '$to', b: '$from' }
                            ]
                        },
                        lastMessage: { $first: '$$ROOT' }
                    }
                },
                { $sort: { 'lastMessage.createdAt': -1 } }
            ]
            return await messages.aggregate(pipeline).toArray()
        } catch (e) { throw e }
    }
}
