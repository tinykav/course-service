// ── Calls to other microservices ─────────────────────────────────

// Member 1 — validate JWT token via Auth Service
const validateTokenWithAuthService = async (token) => {
  try {
    const res = await fetch(`${process.env.AUTH_SERVICE_URL}/auth/validate`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('❌ Auth Service unreachable:', err.message);
    return null;
  }
};

// Member 3 — get live enrollment count for a course
const getEnrollmentCount = async (courseId) => {
  try {
    const res = await fetch(
      `${process.env.ENROLLMENT_SERVICE_URL}/enrollments/course/${courseId}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.count ?? data.length ?? 0;
  } catch (err) {
    console.error('❌ Enrollment Service unreachable:', err.message);
    return null;
  }
};

module.exports = { validateTokenWithAuthService, getEnrollmentCount };
