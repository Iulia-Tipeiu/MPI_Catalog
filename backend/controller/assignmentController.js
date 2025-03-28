import pool from "../db/pool.js";

export const createAssignment = async (req, res) => {
  try {
    const { title, description, maxScore } = req.body;
    const courseId = req.params.courseId;
    const teacherId = req.user.id;

    if (!title) {
      return res
        .status(400)
        .json({ message: "Titlul temei este obligatoriu." });
    }

    const courseResult = await pool.query(
      "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    if (courseResult.rows.length === 0) {
      return res.status(404).json({
        message:
          "Cursul nu a fost găsit sau nu aveți permisiunea de a adăuga teme.",
      });
    }

    const assignmentResult = await pool.query(
      "INSERT INTO assignments (course_id, title, description, max_score) VALUES ($1, $2, $3, $4) RETURNING *",
      [courseId, title, description || "", maxScore || 100]
    );

    const assignment = assignmentResult.rows[0];

    res.status(201).json({
      message: "Temă creată cu succes.",
      assignment,
    });
  } catch (error) {
    console.error("Eroare la crearea temei:", error);
    res
      .status(500)
      .json({ message: "Eroare la crearea temei. Încercați din nou." });
  }
};

export const getAssignmentsByCourse = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user.id;
    const userRole = req.user.role;

    let courseAccessQuery;
    if (userRole === "teacher") {
      courseAccessQuery =
        "SELECT * FROM courses WHERE id = $1 AND teacher_id = $2";
    } else {
      courseAccessQuery = `
        SELECT c.* FROM courses c
        JOIN course_enrollments ce ON c.id = ce.course_id
        WHERE c.id = $1 AND ce.student_id = $2
      `;
    }

    const courseAccess = await pool.query(courseAccessQuery, [
      courseId,
      userId,
    ]);

    if (courseAccess.rows.length === 0) {
      return res.status(403).json({
        message: "Nu aveți acces la acest curs.",
      });
    }

    const assignmentsResult = await pool.query(
      `SELECT id, title, description, max_score, created_at
       FROM assignments
       WHERE course_id = $1
       ORDER BY created_at DESC`,
      [courseId]
    );

    res.status(200).json({
      assignments: assignmentsResult.rows,
    });
  } catch (error) {
    console.error("Eroare la obținerea temelor:", error);
    res
      .status(500)
      .json({ message: "Eroare la obținerea temelor. Încercați din nou." });
  }
};

export const getAssignmentById = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const userId = req.user.id;
    const userRole = req.user.role;

    const assignmentResult = await pool.query(
      `SELECT a.id, a.course_id, a.title, a.description, a.max_score, a.created_at,
              c.course_name, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: "Tema nu a fost găsită." });
    }

    const assignment = assignmentResult.rows[0];

    if (userRole === "teacher" && assignment.teacher_id !== userId) {
      return res.status(403).json({
        message: "Nu aveți permisiunea de a accesa această temă.",
      });
    } else if (userRole === "student") {
      const enrollmentResult = await pool.query(
        "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
        [assignment.course_id, userId]
      );

      if (enrollmentResult.rows.length === 0) {
        return res.status(403).json({
          message: "Nu aveți acces la această temă.",
        });
      }
    }

    let grades = [];
    if (userRole === "teacher") {
      const gradesResult = await pool.query(
        `SELECT g.id, g.student_id, g.score, g.comment,
                u.username, p.first_name, p.last_name
         FROM grades g
         JOIN users u ON g.student_id = u.id
         JOIN profiles p ON u.id = p.user_id
         WHERE g.assignment_id = $1
         ORDER BY p.last_name, p.first_name`,
        [assignmentId]
      );
      grades = gradesResult.rows;

      const studentsWithoutGradesResult = await pool.query(
        `SELECT u.id, u.username, p.first_name, p.last_name
         FROM users u
         JOIN profiles p ON u.id = p.user_id
         JOIN course_enrollments ce ON u.id = ce.student_id
         WHERE ce.course_id = $1
         AND u.id NOT IN (
           SELECT student_id FROM grades WHERE assignment_id = $2
         )
         ORDER BY p.last_name, p.first_name`,
        [assignment.course_id, assignmentId]
      );

      const studentsWithoutGrades = studentsWithoutGradesResult.rows;

      res.status(200).json({
        assignment,
        grades,
        studentsWithoutGrades,
      });
    } else {
      const gradeResult = await pool.query(
        "SELECT id, score, comment FROM grades WHERE assignment_id = $1 AND student_id = $2",
        [assignmentId, userId]
      );

      const grade = gradeResult.rows.length > 0 ? gradeResult.rows[0] : null;

      res.status(200).json({
        assignment,
        grade,
      });
    }
  } catch (error) {
    console.error("Eroare la obținerea detaliilor temei:", error);
    res.status(500).json({
      message: "Eroare la obținerea detaliilor temei. Încercați din nou.",
    });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const { title, description, maxScore } = req.body;
    const teacherId = req.user.id;

    if (!title) {
      return res
        .status(400)
        .json({ message: "Titlul temei este obligatoriu." });
    }

    const assignmentResult = await pool.query(
      `SELECT a.id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (
      assignmentResult.rows.length === 0 ||
      assignmentResult.rows[0].teacher_id !== teacherId
    ) {
      return res.status(404).json({
        message:
          "Tema nu a fost găsită sau nu aveți permisiunea de a o actualiza.",
      });
    }

    const updatedAssignmentResult = await pool.query(
      "UPDATE assignments SET title = $1, description = $2, max_score = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *",
      [title, description || "", maxScore || 100, assignmentId]
    );

    const updatedAssignment = updatedAssignmentResult.rows[0];

    res.status(200).json({
      message: "Temă actualizată cu succes.",
      assignment: updatedAssignment,
    });
  } catch (error) {
    console.error("Eroare la actualizarea temei:", error);
    res.status(500).json({
      message: "Eroare la actualizarea temei. Încercați din nou.",
    });
  }
};

export const deleteAssignment = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const teacherId = req.user.id;

    const assignmentResult = await pool.query(
      `SELECT a.id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (
      assignmentResult.rows.length === 0 ||
      assignmentResult.rows[0].teacher_id !== teacherId
    ) {
      return res.status(404).json({
        message:
          "Tema nu a fost găsită sau nu aveți permisiunea de a o șterge.",
      });
    }

    await pool.query("DELETE FROM assignments WHERE id = $1", [assignmentId]);

    res.status(200).json({
      message: "Temă ștearsă cu succes.",
    });
  } catch (error) {
    console.error("Eroare la ștergerea temei:", error);
    res
      .status(500)
      .json({ message: "Eroare la ștergerea temei. Încercați din nou." });
  }
};

export const addOrUpdateGrade = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    const { studentId, score, comment } = req.body;
    const teacherId = req.user.id;

    if (!studentId || score === undefined) {
      return res
        .status(400)
        .json({ message: "ID-ul studentului și nota sunt obligatorii." });
    }

    const assignmentResult = await pool.query(
      `SELECT a.id, a.course_id, c.teacher_id
       FROM assignments a
       JOIN courses c ON a.course_id = c.id
       WHERE a.id = $1`,
      [assignmentId]
    );

    if (
      assignmentResult.rows.length === 0 ||
      assignmentResult.rows[0].teacher_id !== teacherId
    ) {
      return res.status(404).json({
        message:
          "Tema nu a fost găsită sau nu aveți permisiunea de a adăuga note.",
      });
    }

    const courseId = assignmentResult.rows[0].course_id;

    const enrollmentResult = await pool.query(
      "SELECT * FROM course_enrollments WHERE course_id = $1 AND student_id = $2",
      [courseId, studentId]
    );

    if (enrollmentResult.rows.length === 0) {
      return res
        .status(400)
        .json({ message: "Studentul nu este înscris la acest curs." });
    }

    const existingGradeResult = await pool.query(
      "SELECT * FROM grades WHERE assignment_id = $1 AND student_id = $2",
      [assignmentId, studentId]
    );

    let grade;
    if (existingGradeResult.rows.length > 0) {
      const updateResult = await pool.query(
        "UPDATE grades SET score = $1, comment = $2, updated_at = CURRENT_TIMESTAMP WHERE assignment_id = $3 AND student_id = $4 RETURNING *",
        [score, comment || null, assignmentId, studentId]
      );
      grade = updateResult.rows[0];
    } else {
      const insertResult = await pool.query(
        "INSERT INTO grades (assignment_id, student_id, score, comment) VALUES ($1, $2, $3, $4) RETURNING *",
        [assignmentId, studentId, score, comment || null]
      );
      grade = insertResult.rows[0];
    }

    res.status(200).json({
      message: "Notă adăugată/actualizată cu succes.",
      grade,
    });
  } catch (error) {
    console.error("Eroare la adăugarea/actualizarea notei:", error);
    res.status(500).json({
      message: "Eroare la adăugarea/actualizarea notei. Încercați din nou.",
    });
  }
};

export const deleteGrade = async (req, res) => {
  try {
    const gradeId = req.params.gradeId;
    const teacherId = req.user.id;

    const gradeResult = await pool.query(
      `SELECT g.id, g.assignment_id, a.course_id, c.teacher_id
       FROM grades g
       JOIN assignments a ON g.assignment_id = a.id
       JOIN courses c ON a.course_id = c.id
       WHERE g.id = $1`,
      [gradeId]
    );

    if (
      gradeResult.rows.length === 0 ||
      gradeResult.rows[0].teacher_id !== teacherId
    ) {
      return res.status(404).json({
        message:
          "Nota nu a fost găsită sau nu aveți permisiunea de a o șterge.",
      });
    }

    await pool.query("DELETE FROM grades WHERE id = $1", [gradeId]);

    res.status(200).json({
      message: "Notă ștearsă cu succes.",
    });
  } catch (error) {
    console.error("Eroare la ștergerea notei:", error);
    res
      .status(500)
      .json({ message: "Eroare la ștergerea notei. Încercați din nou." });
  }
};
