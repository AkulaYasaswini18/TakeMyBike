module.exports = async function sendEmail(to, subject, body) {
  console.log('sendEmail (mock):', { to, subject, body });
  return true;
};
