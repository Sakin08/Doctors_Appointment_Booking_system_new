import express from 'express';
import {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
  testUrls,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/init', initPayment);
router.post('/ipn', paymentIPN);
router.get('/test-urls', testUrls);

router.route('/success/:tran_id')
  .post(paymentSuccess)
  .get(paymentSuccess);

router.route('/success/:tran_id/:appointmentId')
  .post(paymentSuccess)
  .get(paymentSuccess);

router.route('/fail')
  .post(paymentFail)
  .get(paymentFail);

router.route('/cancel')
  .post(paymentCancel)
  .get(paymentCancel);

export default router;
