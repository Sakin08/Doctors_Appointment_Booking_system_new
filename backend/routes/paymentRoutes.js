import express from 'express';
import {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
  paymentIPN,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/init', initPayment);
router.post('/ipn', paymentIPN);

router.route('/success/:tran_id')
  .post(paymentSuccess)
  .get(paymentSuccess);

router.route('/fail')
  .get(paymentFail)
  .post(paymentFail);

router.route('/cancel')
  .get(paymentCancel)
  .post(paymentCancel);


export default router;
