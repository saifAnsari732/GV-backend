const express = require('express');
const router = express.Router();
const {
  createCertificate,
  getAllCertificates,
  getCertificateById,
  getStudentCertificates,
  verifyCertificate,
  updateCertificate,
  deleteCertificate
} = require('../controllers/certificateController');

// Specific routes PEHLE
router.get('/verify/:certNumber', verifyCertificate);
router.get('/student/:studentId', getStudentCertificates);

// Generic routes BAAD MEIN
router.get('/', getAllCertificates);
router.post('/', createCertificate);
router.get('/:id', getCertificateById);
router.put('/:id', updateCertificate);
router.delete('/:id', deleteCertificate);

module.exports = router;