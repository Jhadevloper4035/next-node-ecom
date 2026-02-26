function toSafeUser(userDoc) {
  return {
    id: userDoc._id,
    fullName: userDoc.fullName,
    email: userDoc.email,
    mobileNumber: userDoc.mobileNumber,
    role: userDoc.role,
    isEmailVerified: userDoc.isEmailVerified,
    isBlocked: userDoc.isBlocked,
    createdAt: userDoc.createdAt,
    updatedAt: userDoc.updatedAt,
  };
}

module.exports = { toSafeUser };
