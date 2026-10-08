const PASSWORD_RECENTLY_USED = "password_recently_used";

function getPasswordResetErrorResponse(error) {
  if (error?.type === PASSWORD_RECENTLY_USED) {
    return {
      status: 400,
      body: {
        success: false,
        code: PASSWORD_RECENTLY_USED,
        message:
          "This password is too similar to one you used recently. Please choose a different password.",
      },
    };
  }

  return {
    status: 500,
    body: {
      success: false,
      message: "Unable to reset password. Please try again later.",
    },
  };
}

module.exports = { getPasswordResetErrorResponse };
