import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db/pool.js";
import dotenv from "dotenv";

dotenv.config();

export const register = async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone,
      address,
    } = req.body;

    if (!username || !email || !password || !role || !firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile obligatorii trebuie completate." });
    }

    if (!["teacher", "student"].includes(role)) {
      return res
        .status(400)
        .json({ message: 'Rolul trebuie să fie "teacher" sau "student".' });
    }

    const userCheck = await client.query(
      "SELECT * FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );

    if (userCheck.rows.length > 0) {
      return res.status(400).json({
        message: "Numele de utilizator sau email-ul este deja utilizat.",
      });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await client.query("BEGIN");

    const userResult = await client.query(
      "INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id",
      [username, email, passwordHash, role]
    );

    const userId = userResult.rows[0].id;

    await client.query(
      "INSERT INTO profiles (user_id, first_name, last_name, phone, address) VALUES ($1, $2, $3, $4, $5)",
      [userId, firstName, lastName, phone || null, address || null]
    );

    await client.query("COMMIT");

    const token = jwt.sign(
      {
        id: userId,
        username: username,
        email: email,
        role: role,
        firstName: firstName,
        lastName: lastName,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(201).json({
      message: "Utilizator înregistrat cu succes.",
      token,
      user: {
        id: userId,
        username: username,
        email: email,
        role: role,
        firstName: firstName,
        lastName: lastName,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Eroare la înregistrare:", error);
    res
      .status(500)
      .json({ message: "Eroare la înregistrare. Încercați din nou." });
  } finally {
    client.release();
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const userResult = await pool.query(
      "SELECT u.id, u.username, u.email, u.password_hash, u.role, p.first_name, p.last_name " +
        "FROM users u " +
        "JOIN profiles p ON u.id = p.user_id " +
        "WHERE u.username = $1 OR u.email = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return res
        .status(401)
        .json({ message: "Numele de utilizator sau parola incorectă." });
    }

    const user = userResult.rows[0];

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Numele de utilizator sau parola incorectă." });
    }

    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.status(200).json({
      message: "Autentificare reușită.",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
      },
    });
  } catch (error) {
    console.error("Eroare la autentificare:", error);
    res
      .status(500)
      .json({ message: "Eroare la autentificare. Încercați din nou." });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Utilizatorul nu a fost găsit." });
    }

    const userId = userResult.rows[0].id;

    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [passwordHash, userId]
    );

    res.status(200).json({ message: "Parola a fost resetată cu succes." });
  } catch (error) {
    console.error("Eroare la resetarea parolei:", error);
    res
      .status(500)
      .json({ message: "Eroare la resetarea parolei. Încercați din nou." });
  }
};
