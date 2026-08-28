export const sanitizeUser = (user) => {
  if (!user) return user;
  const { passwordHash, ...safeUser } = user;
  return safeUser;
};
