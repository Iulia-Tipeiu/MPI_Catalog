import pool from "../db/pool.js";

export const getAllCourses = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    let coursesResult;

    if (userRole === "teacher") {
      coursesResult = await pool.query(
        `SELECT c.id, c.course_name, c.description, 
                  u.username as teacher_username, 
                  p.first_name as teacher_first_name, 
                  p.last_name as teacher_last_name,
                  COUNT(ce.student_id) as student_count
           FROM courses c
           JOIN users u ON c.teacher_id = u.id
           JOIN profiles p ON u.id = p.user_id
           LEFT JOIN course_enrollments ce ON c.id = ce.course_id
           WHERE c.teacher_id = $1
           GROUP BY c.id, c.course_name, c.description, u.username, p.first_name, p.last_name
           ORDER BY c.created_at DESC`,
        [userId]
      );
    } else {
      coursesResult = await pool.query(
        `SELECT c.id, c.course_name, c.description, 
                  u.username as teacher_username, 
                  p.first_name as teacher_first_name, 
                  p.last_name as teacher_last_name
           FROM courses c
           JOIN users u ON c.teacher_id = u.id
           JOIN profiles p ON u.id = p.user_id
           JOIN course_enrollments ce ON c.id = ce.course_id
           WHERE ce.student_id = $1
           ORDER BY c.created_at DESC`,
        [userId]
      );
    }

    res.status(200).json({
      courses: coursesResult.rows,
    });
  } catch (error) {
    console.error("Eroare la obținerea cursurilor:", error);
    res
      .status(500)
      .json({ message: "Eroare la obținerea cursurilor. Încercați din nou." });
  }
};

export const getCourseById = async (req, res) => {
  try {
    const courseId = req.params.id;
    const userId = req.user.id;
    const userRole = req.user.role;

    const courseResult = await pool.query(
      `SELECT c.id, c.course_name, c.description, c.teacher_id,
                u.username as teacher_username, 
                p.first_name as teacher_first_name, 
                p.last_name as teacher_last_name
         FROM courses c
         JOIN users u ON c.teacher_id = u.id
         JOIN profiles p ON u.id = p.user_id
         WHERE c.id = $1`,
      [courseId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: "Cursul nu a fost găsit." });
    }

    const course = courseResult.rows[0];

    if (userRole === "teacher" && course.teacher_id !== userId) {
      return res.status(403).json({
        message: "Nu aveți permisiunea de a accesa acest curs.",
      });
    } else if (userRole === "student") {
      const enrollmentResult = await pool.query(
        "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        [courseId, userId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({
          message: "Nu sunteți înscris la acest curs.",
        });
      }
    }

    let students = [];
    if (userRole === "teacher") {
      const studentsResult = await pool.query(
        `SELECT u.id, u.username, p.first_name, p.last_name
           FROM users u
           JOIN profiles p ON u.id = p.user_id
           JOIN course_enrollments ce ON u.id = ce.student_id
           WHERE ce.course_id = $1
           ORDER BY p.last_name, p.first_name`,
        [courseId]
      );
      students = studentsResult.rows;
    }

    const assignmentsResult = await pool.query(
      `SELECT id, title, description, max_score, created_at
         FROM assignments
         WHERE course_id = $1
         ORDER BY created_at DESC`,
      [courseId]
    );

    res.status(200).json({
      course,
      students: userRole === "teacher" ? students : undefined,
      assignments: assignmentsResult.rows,
    });
  } catch (error) {
    console.error("Eroare la obținerea detaliilor cursului:", error);
    res.status(500).json({
      message: "Eroare la obținerea detaliilor cursului. Încercați din nou.",
    });
  }
};

export const createCourse = async (req, res) => {
  try {
    const { courseName, description } = req.body;
    const teacherId = req.user.id;

    if (!courseName) {
      return res
        .status(400)
        .json({ message: "Numele cursului este obligatoriu." });
    }

    const courseResult = await pool.query(
      "INSERT INTO courses (course_name, description, teacher_id) VALUES ($1, $2, $3) RETURNING *",
      [courseName, description || "", teacherId]
    );

    const course = courseResult.rows[0];

    res.status(201).json({
      message: "Curs creat cu succes.",
      course,
    });
  } catch (error) {
    console.error("Eroare la crearea cursului:", error);
    res
      .status(500)
      .json({ message: "Eroare la crearea cursului. Încercați din nou." });
  }
};

export const updateCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const { courseName, description } = req.body;
    const teacherId = req.user.id;

    if (!courseName) {
      return res
        .status(400)
        .json({ message: "Numele cursului este obligatoriu." });
    }

    const checkResult = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Cursul nu a fost găsit sau nu aveți permisiunea de a-l edita.",
      });
    }

    const courseResult = await pool.query(
      "UPDATE courses SET course_name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *",
      [courseName, description || "", courseId]
    );

    const course = courseResult.rows[0];

    res.status(200).json({
      message: "Curs actualizat cu succes.",
      course,
    });
  } catch (error) {
    console.error("Eroare la actualizarea cursului:", error);
    res.status(500).json({
      message: "Eroare la actualizarea cursului. Încercați din nou.",
    });
  }
};

export const deleteCourse = async (req, res) => {
  try {
    const courseId = req.params.id;
    const teacherId = req.user.id;

    const checkResult = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Cursul nu a fost găsit sau nu aveți permisiunea de a-l șterge.",
      });
    }

    await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);

    res.status(200).json({
      message: "Curs șters cu succes.",
    });
  } catch (error) {
    console.error("Eroare la ștergerea cursului:", error);
    res
      .status(500)
      .json({ message: "Eroare la ștergerea cursului. Încercați din nou." });
  }
};

export const enrollStudent = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const { studentUsername } = req.body;
    const teacherId = req.user.id;

    if (!studentUsername) {
      return res
        .status(400)
        .json({ message: "Username-ul studentului este obligatoriu." });
    }

    const courseResult = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Cursul nu a fost găsit sau nu aveți permisiunea de a înscrie studenți.",
      });
    }

    const studentResult = await pool.query(
      "SELECT id FROM users WHERE username = $1 AND role = 'student'",
      [studentUsername]
    );

    if (studentResult.rows.length === 0) {
      return res
        .status(404)
        .json({ message: "Studentul nu a fost găsit sau nu este student." });
    }

    const studentId = studentResult.rows[0].id;

    const enrollmentCheck = await pool.query(
      "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );

    if (enrollmentCheck.rows.length > 0) {
      return res
        .status(400)
        .json({ message: "Studentul este deja înscris la acest curs." });
    }

    await pool.query(
      "INSERT INTO course_enrollments (course_id, student_id) VALUES ($1, $2)",
      [courseId, studentId]
    );

    res.status(201).json({
      message: "Student înscris cu succes.",
    });
  } catch (error) {
    console.error("Eroare la înscrierea studentului:", error);
    res.status(500).json({
      message: "Eroare la înscrierea studentului. Încercați din nou.",
    });
  }
};

export const unenrollStudent = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.params.studentId;
    const teacherId = req.user.id;

    const courseResult = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Cursul nu a fost găsit sau nu aveți permisiunea de a dezînscrie studenți.",
      });
    }

    await pool.query(
      "DELETE FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );

    res.status(200).json({
      message: "Student dezînscris cu succes.",
    });
  } catch (error) {
    console.error("Eroare la dezînscrierea studentului:", error);
    res.status(500).json({
      message: "Eroare la dezînscrierea studentului. Încercați din nou.",
    });
  }
};

export const getUnenrolledStudents = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const teacherId = req.user.id;

    const courseCheck = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (courseCheck.rows.length === 0) {
      return res.status(403).json({
        message: "Nu aveți permisiunea de a accesa acest curs.",
      });
    }

    const unenrolledStudentsQuery = `
      SELECT u.id, u.username, u.email, p.first_name, p.last_name
      FROM users u
      JOIN profiles p ON u.id = p.user_id
      WHERE u.role = 'student'
      AND u.id NOT IN (
        SELECT student_id FROM course_enrollments WHERE course_id = $1
      )
      ORDER BY p.last_name, p.first_name
    `;

    const unenrolledStudents = await pool.query(unenrolledStudentsQuery, [
      courseId,
    ]);

    res.status(200).json({
      unenrolledStudents: unenrolledStudents.rows,
    });
  } catch (error) {
    console.error("Eroare la obținerea studenților neînscriși:", error);
    res.status(500).json({
      message: "Eroare la obținerea studenților neînscriși. Încercați din nou.",
    });
  }
};

export const bulkEnrollStudents = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const courseId = req.params.courseId;
    const { studentIds } = req.body;
    
    console.log("Course ID:", courseId);
    console.log("Student IDs:", studentIds);
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Lista de ID-uri ale studenților este obligatorie." });
    }

    await client.query('BEGIN');
    
    const existingEnrollments = await client.query(
      `SELECT student_id::text FROM course_enrollments WHERE course_id = $1`,
      [courseId]
    );
    
    const alreadyEnrolledIds = existingEnrollments.rows.map(row => row.student_id);
    console.log("Already enrolled:", alreadyEnrolledIds);
    
    const newStudentIds = studentIds.filter(id => !alreadyEnrolledIds.includes(id));
    console.log("New students to enroll:", newStudentIds);
    
    if (newStudentIds.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: "Toți studenții selectați sunt deja înscriși la acest curs." });
    }
    
    let successCount = 0;
    for (const studentId of newStudentIds) {
      try {
       
        const query = `
          INSERT INTO course_enrollments (course_id, student_id) 
          VALUES ($1, $2::text::uuid)
        `;
        
        await client.query(query, [courseId, studentId]);
        successCount++;
      } catch (insertError) {
        console.error(`Failed to enroll student ${studentId}:`, insertError);
      }
    }
    
    await client.query('COMMIT');
    
    return res.status(201).json({
      message: `${successCount} studenți au fost înscriși cu succes.`,
      enrolledCount: successCount
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Eroare la înscrierea în masă a studenților:", error);
    return res.status(500).json({
      message: "Eroare la înscrierea studenților. Încercați din nou.",
      errorDetail: error.message
    });
  } finally {
    client.release();
  }
};
