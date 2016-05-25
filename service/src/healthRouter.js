import express from 'express';
const router = new express.Router();

router.get('/health', (req, res) => res.status(200).send({}));

export default router;
