module.exports = async function sendEmail(to, subject, body) {
  // Mock email sending in dev — log to console
  console.log('MOCK EMAIL:', { to, subject, body });
  return true;
};
