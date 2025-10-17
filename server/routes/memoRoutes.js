const express = require('express');
const memoController = require('../controllers/memoController');
const authController = require('../controllers/authController');

const router = express.Router();

// Protect all routes after this middleware
router.use(authController.protect);

// Routes for /api/v1/memos
router
  .route('/')
  .get(memoController.getUserMemos)
  .post(memoController.createMemo);

// Routes for /api/v1/memos/search
router.get('/search', memoController.searchMemos);

// Routes for /api/v1/memos/:id
router
  .route('/:id')
  .get(memoController.getMemo)
  .patch(memoController.updateMemo)
  .delete(memoController.deleteMemo);

module.exports = router;
