const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

router.get('/player/:userId', playerController.getPlayer);
router.post('/player/save', playerController.savePlayer);
router.post('/player/record', playerController.saveGameRecord);
router.get('/player/:userId/records', playerController.getUserRecords);
router.get('/rank', playerController.getRank);
router.get('/user/:userId', playerController.getUserInfo);
router.post('/user/title', playerController.updateUserTitle);
router.post('/user/lastlevel', playerController.updateUserLastLevel);
router.get('/alltitles', playerController.getAllTitles);

module.exports = router;