import { jest } from '@jest/globals';
import { 
  getAllCourses, 
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent
} from '../controller/courseController.js';

// Mock the pool module
jest.mock('../database/pool.js', () => {
  return {
    default: { query: jest.fn() },
    query: jest.fn()
  };
});

// Mock request and response
const mockRequest = () => {
  return {
    body: {},
    user: { id: 'teacher-id', role: 'teacher' },
    params: {}
  };
};

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Course Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('getAllCourses', () => {
    it('should get all courses for a teacher', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.user.role = 'teacher';
      
      const mockCourses = [
        { id: 'course-1', course_name: 'Math 101', student_count: 15 },
        { id: 'course-2', course_name: 'Physics 101', student_count: 10 }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockCourses });

      // Act
      await getAllCourses(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ courses: mockCourses });
    });

    it('should get enrolled courses for a student', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.user.role = 'student';
      
      const mockCourses = [
        { id: 'course-1', course_name: 'Math 101' },
        { id: 'course-2', course_name: 'Physics 101' }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockCourses });

      // Act
      await getAllCourses(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ courses: mockCourses });
    });
  });

  describe('getCourseById', () => {
    it('should get course details for a teacher who owns the course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'course-id';
      
      const mockCourse = {
        id: 'course-id',
        course_name: 'Math 101',
        teacher_id: 'teacher-id'
      };
      
      const mockStudents = [
        { id: 'student-1', username: 'student1' },
        { id: 'student-2', username: 'student2' }
      ];
      
      const mockAssignments = [
        { id: 'assignment-1', title: 'Homework 1' }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: [mockCourse] });
      pool.query.mockResolvedValueOnce({ rows: mockStudents });
      pool.query.mockResolvedValueOnce({ rows: mockAssignments });

      // Act
      await getCourseById(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        course: mockCourse,
        students: mockStudents,
        assignments: mockAssignments
      });
    });

    it('should return 403 for a teacher who does not own the course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'course-id';
      
      const mockCourse = {
        id: 'course-id',
        course_name: 'Math 101',
        teacher_id: 'different-teacher-id'  // Different teacher
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockCourse] });

      // Act
      await getCourseById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu aveți permisiunea de a accesa acest curs.'
      }));
    });

    it('should get course details for an enrolled student', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.user.role = 'student';
      req.params.id = 'course-id';
      
      const mockCourse = {
        id: 'course-id',
        course_name: 'Math 101'
      };
      
      const mockEnrollment = { course_id: 'course-id', student_id: 'student-id' };
      const mockAssignments = [{ id: 'assignment-1', title: 'Homework 1' }];
      
      pool.query.mockResolvedValueOnce({ rows: [mockCourse] });
      pool.query.mockResolvedValueOnce({ rows: [mockEnrollment] });
      pool.query.mockResolvedValueOnce({ rows: mockAssignments });

      // Act
      await getCourseById(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        course: mockCourse,
        assignments: mockAssignments
      });
    });
  });

  describe('createCourse', () => {
    it('should create a new course successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.body = {
        courseName: 'New Course',
        description: 'Course description'
      };
      
      const mockCourse = {
        id: 'new-course-id',
        course_name: 'New Course',
        description: 'Course description'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockCourse] });

      // Act
      await createCourse(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Curs creat cu succes.',
        course: mockCourse
      }));
    });

    it('should return 400 if course name is missing', async () => {
      // Arrange
      req.body = {
        description: 'Course description'
        // Missing courseName
      };

      // Act
      await createCourse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Numele cursului este obligatoriu.'
      }));
    });
  });

  describe('updateCourse', () => {
    it('should update a course successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'course-id';
      req.body = {
        courseName: 'Updated Course',
        description: 'Updated description'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course exists
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'course-id', 
          course_name: 'Updated Course',
          description: 'Updated description'
        }]
      });

      // Act
      await updateCourse(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Curs actualizat cu succes.'
      }));
    });

    it('should return 404 if course does not exist', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'nonexistent-course';
      req.body = {
        courseName: 'Updated Course'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No course found

      // Act
      await updateCourse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cursul nu a fost găsit sau nu aveți permisiunea de a-l edita.'
      }));
    });
  });

  describe('deleteCourse', () => {
    it('should delete a course successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'course-id';
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course exists
      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // Deleted row

      // Act
      await deleteCourse(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Curs șters cu succes.'
      }));
    });

    it('should return 404 if course does not exist', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.id = 'nonexistent-course';
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No course found

      // Act
      await deleteCourse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cursul nu a fost găsit sau nu aveți permisiunea de a-l șterge.'
      }));
    });
  });

  describe('enrollStudent', () => {
    it('should enroll a student successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      req.body = {
        studentUsername: 'student1'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'student-id' }] }); // Student exists
      pool.query.mockResolvedValueOnce({ rows: [] }); // Not already enrolled
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'enrollment-id' }] }); // Enrolled

      // Act
      await enrollStudent(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Student înscris cu succes.'
      }));
    });

    it('should return 400 if student is already enrolled', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      req.body = {
        studentUsername: 'student1'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'student-id' }] }); // Student exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'enrollment-id' }] }); // Already enrolled

      // Act
      await enrollStudent(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Studentul este deja înscris la acest curs.'
      }));
    });
  });
});