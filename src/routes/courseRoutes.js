const express = require('express');
const router = express.Router();
const { authenticate, adminOnly } = require('../middleware/auth');
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  updateCapacity
} = require('../controllers/courseController');

// Public routes
router.get('/',     getAllCourses);
router.get('/:id',  getCourseById);

// Admin only routes
router.post('/',    authenticate, adminOnly, createCourse);
router.put('/:id',  authenticate, adminOnly, updateCourse);

// Called by Enrollment Service
router.put('/:id/capacity', updateCapacity);

module.exports = router;
