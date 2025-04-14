import { jest } from '@jest/globals';
import { 
  createAssignment, 
  getAssignmentsByCourse,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  addOrUpdateGrade
} from '../controller/assignmentController.js';

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

describe('Assignment Controller', () => {
  let req, res;
  
  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    jest.clearAllMocks();
  });

  describe('createAssignment', () => {
    it('should create a new assignment successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      req.body = {
        title: 'New Assignment',
        description: 'Assignment description',
        maxScore: 100
      };
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course exists
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          title: 'New Assignment' 
        }]
      });

      // Act
      await createAssignment(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temă creată cu succes.'
      }));
    });

    it('should return 400 if title is missing', async () => {
      // Arrange
      req.params.courseId = 'course-id';
      req.body = {
        description: 'Assignment description'
        // Missing title
      };

      // Act
      await createAssignment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Titlul temei este obligatoriu.'
      }));
    });

    it('should return 404 if course does not exist', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'nonexistent-course';
      req.body = {
        title: 'New Assignment'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No course found

      // Act
      await createAssignment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Cursul nu a fost găsit sau nu aveți permisiunea de a adăuga teme.'
      }));
    });
  });

  describe('getAssignmentsByCourse', () => {
    it('should get all assignments for a course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'course-id' }] }); // Course access check
      pool.query.mockResolvedValueOnce({ 
        rows: [
          { id: 'assignment-1', title: 'Assignment 1' },
          { id: 'assignment-2', title: 'Assignment 2' }
        ]
      });

      // Act
      await getAssignmentsByCourse(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        assignments: expect.arrayContaining([
          expect.objectContaining({ id: 'assignment-1' }),
          expect.objectContaining({ id: 'assignment-2' })
        ])
      }));
    });

    it('should return 403 if user does not have access to the course', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.courseId = 'course-id';
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No access

      // Act
      await getAssignmentsByCourse(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu aveți acces la acest curs.'
      }));
    });
  });

  describe('getAssignmentById', () => {
    it('should get assignment details for a teacher', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      
      const mockAssignment = {
        id: 'assignment-id',
        title: 'Assignment',
        course_id: 'course-id',
        teacher_id: 'teacher-id'
      };
      
      const mockGrades = [
        { id: 'grade-1', student_id: 'student-1', score: 85 }
      ];
      
      const mockStudentsWithoutGrades = [
        { id: 'student-2', username: 'student2' }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: [mockAssignment] });
      pool.query.mockResolvedValueOnce({ rows: mockGrades });
      pool.query.mockResolvedValueOnce({ rows: mockStudentsWithoutGrades });

      // Act
      await getAssignmentById(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(3);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        assignment: mockAssignment,
        grades: mockGrades,
        studentsWithoutGrades: mockStudentsWithoutGrades
      });
    });

    it('should return 403 if teacher does not have permission', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      
      const mockAssignment = {
        id: 'assignment-id',
        teacher_id: 'other-teacher-id'  // Different teacher
      };
      
      pool.query.mockResolvedValueOnce({ rows: [mockAssignment] });

      // Act
      await getAssignmentById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Nu aveți permisiunea de a accesa această temă.'
      }));
    });
  });

  describe('updateAssignment', () => {
    it('should update an assignment successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      req.body = {
        title: 'Updated Assignment',
        description: 'Updated description',
        maxScore: 90
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          teacher_id: 'teacher-id' 
        }]
      });
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          title: 'Updated Assignment' 
        }]
      });

      // Act
      await updateAssignment(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temă actualizată cu succes.'
      }));
    });

    it('should return 404 if assignment does not exist', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'nonexistent-assignment';
      req.body = {
        title: 'Updated Assignment'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No assignment found

      // Act
      await updateAssignment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Tema nu a fost găsită sau nu aveți permisiunea de a o actualiza.'
      }));
    });
  });

  describe('deleteAssignment', () => {
    it('should delete an assignment successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          teacher_id: 'teacher-id' 
        }]
      });
      pool.query.mockResolvedValueOnce({ rowCount: 1 }); // Deleted row

      // Act
      await deleteAssignment(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Temă ștearsă cu succes.'
      }));
    });

    it('should return 404 if assignment does not exist', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'nonexistent-assignment';
      
      pool.query.mockResolvedValueOnce({ rows: [] }); // No assignment found

      // Act
      await deleteAssignment(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Tema nu a fost găsită sau nu aveți permisiunea de a o șterge.'
      }));
    });
  });

  describe('addOrUpdateGrade', () => {
    it('should add a grade successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      req.body = {
        studentId: 'student-id',
        score: 85,
        comment: 'Good job!'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          course_id: 'course-id',
          teacher_id: 'teacher-id' 
        }]
      });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'enrollment-id' }] }); // Student enrolled
      pool.query.mockResolvedValueOnce({ rows: [] }); // No existing grade
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'grade-id', 
          score: 85 
        }]
      });

      // Act
      await addOrUpdateGrade(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Notă adăugată/actualizată cu succes.'
      }));
    });

    it('should update an existing grade successfully', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      req.body = {
        studentId: 'student-id',
        score: 90,
        comment: 'Updated comment'
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          course_id: 'course-id',
          teacher_id: 'teacher-id' 
        }]
      });
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'enrollment-id' }] }); // Student enrolled
      pool.query.mockResolvedValueOnce({ rows: [{ id: 'grade-id' }] }); // Existing grade
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'grade-id', 
          score: 90 
        }]
      });

      // Act
      await addOrUpdateGrade(req, res);

      // Assert
      expect(pool.query).toHaveBeenCalledTimes(4);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Notă adăugată/actualizată cu succes.'
      }));
    });

    it('should return 400 if student is not enrolled', async () => {
      // Arrange
      const pool = require('../db/pool.js');
      req.params.assignmentId = 'assignment-id';
      req.body = {
        studentId: 'student-id',
        score: 85
      };
      
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 'assignment-id', 
          course_id: 'course-id',
          teacher_id: 'teacher-id' 
        }]
      });
      pool.query.mockResolvedValueOnce({ rows: [] }); // Student not enrolled

      // Act
      await addOrUpdateGrade(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Studentul nu este înscris la acest curs.'
      }));
    });
  });
});