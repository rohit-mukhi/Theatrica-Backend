import express from 'express'
import ConnectionCtrl from './connections.controller.js'
import MessageCtrl from './messages.controller.js'
import { authMiddleware } from './authMiddleware.js'

const router = express.Router()

// ── CONNECTIONS ──
router.post('/request/:username',  authMiddleware, ConnectionCtrl.apiSendRequest)
router.post('/accept/:username',   authMiddleware, ConnectionCtrl.apiAcceptRequest)
router.post('/reject/:username',   authMiddleware, ConnectionCtrl.apiRejectRequest)
router.delete('/friend/:username', authMiddleware, ConnectionCtrl.apiRemoveFriend)
router.get('/status/:username',    authMiddleware, ConnectionCtrl.apiGetStatus)
router.get('/requests',            authMiddleware, ConnectionCtrl.apiGetRequests)
router.get('/friends',             authMiddleware, ConnectionCtrl.apiGetFriends)

// ── BLOCKING ──
router.post('/block/:username',    authMiddleware, ConnectionCtrl.apiBlock)
router.post('/unblock/:username',  authMiddleware, ConnectionCtrl.apiUnblock)
router.get('/blocked',             authMiddleware, ConnectionCtrl.apiGetBlocked)

// ── MESSAGES ──
router.get('/messages',                    authMiddleware, MessageCtrl.apiGetInbox)
router.get('/messages/unread',             authMiddleware, MessageCtrl.apiGetUnread)
router.get('/messages/:username',          authMiddleware, MessageCtrl.apiGetConversation)

export default router
