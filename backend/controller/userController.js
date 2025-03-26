import bcrypt from "bcrypt";
import pool from "../db/pool.js";

export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profileResult = await pool.query(
      "SELECT u.username, u.email, u.role, p.first_name, p.last_name, p.phone, p.address " +
        "FROM users u " +
        "JOIN profiles p ON u.id = p.user_id " +
        "WHERE u.id = $1",
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ message: "Profil negăsit." });
    }

    const profile = profileResult.rows[0];

    res.status(200).json({
      username: profile.username,
      email: profile.email,
      role: profile.role,
      firstName: profile.first_name,
      lastName: profile.last_name,
      phone: profile.phone || null,
      address: profile.address || null,
    });
  } catch (error) {
    console.error("Eroare la obținerea profilului:", error);
    res
      .status(500)
      .json({ message: "Eroare la obținerea profilului. Încercați din nou." });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, phone, address } = req.body;

    if (!firstName || !lastName) {
      return res
        .status(400)
        .json({ message: "Numele și prenumele sunt obligatorii." });
    }

    await pool.query(
      "UPDATE profiles SET first_name = $1, last_name = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP " +
        "WHERE user_id = $5",
      [firstName, lastName, phone || null, address || null, userId]
    );

    const updatedProfile = await pool.query(
      "SELECT u.username, u.email, u.role, p.first_name, p.last_name, p.phone, p.address " +
        "FROM users u " +
        "JOIN profiles p ON u.id = p.user_id " +
        "WHERE u.id = $1",
      [userId]
    );

    const profile = updatedProfile.rows[0];

    res.status(200).json({
      message: "Profil actualizat cu succes.",
      profile: {
        username: profile.username,
        email: profile.email,
        role: profile.role,
        firstName: profile.first_name,
        lastName: profile.last_name,
        phone: profile.phone || null,
        address: profile.address || null,
      },
    });
  } catch (error) {
    console.error("Eroare la actualizarea profilului:", error);
    res.status(500).json({
      message: "Eroare la actualizarea profilului. Încercați din nou.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Toate câmpurile sunt obligatorii." });
    }

    const userResult = await pool.query(
      "SELECT password_hash FROM users WHERE id = $1",
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "Utilizator negăsit." });
    }

    const passwordHash = userResult.rows[0].password_hash;

    const isPasswordValid = await bcrypt.compare(currentPassword, passwordHash);

    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Parola curentă este incorectă." });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS) || 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await pool.query(
      "UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [newPasswordHash, userId]
    );

    res.status(200).json({ message: "Parola a fost schimbată cu succes." });
  } catch (error) {
    console.error("Eroare la schimbarea parolei:", error);
    res
      .status(500)
      .json({ message: "Eroare la schimbarea parolei. Încercați din nou." });
  }
};
