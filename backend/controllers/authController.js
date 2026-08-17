const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme';

function generateAuthToken(user) {
	return jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
}

exports.register = async (req, res, next) => {
	try {
		const { name, email, password, role, phone } = req.body;
		if (!['renter', 'owner'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
		const existing = await User.findOne({ email });
		if (existing) return res.status(400).json({ error: 'Email already in use' });
		const salt = await bcrypt.genSalt(10);
		const passwordHash = await bcrypt.hash(password, salt);
		const user = await User.create({ name, email, passwordHash, role, phone });

		// generate email verification token
		const verifyToken = jwt.sign({ id: user._id, type: 'verify' }, JWT_SECRET, { expiresIn: '1d' });
		const verifyLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/verify-email?token=${verifyToken}`;
		await sendEmail(user.email, 'Verify your BikeShare email', `Click to verify: ${verifyLink}`);

		const out = user.toObject();
		delete out.passwordHash;
		res.status(201).json({ user: out, message: 'Registered. Please verify your email.' });
	} catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
	try {
		const { email, password } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.status(400).json({ error: 'Invalid credentials' });
		const match = await bcrypt.compare(password, user.passwordHash || '');
		if (!match) return res.status(400).json({ error: 'Invalid credentials' });
		const token = generateAuthToken(user);
		const out = user.toObject(); delete out.passwordHash;
		res.json({ token, user: out });
	} catch (err) { next(err); }
};

exports.logout = async (req, res) => {
	// stateless JWT: client should drop token
	res.json({ ok: true });
};

exports.forgotPassword = async (req, res, next) => {
	try {
		const { email } = req.body;
		const user = await User.findOne({ email });
		if (!user) return res.json({ ok: true }); // do not reveal
		const token = jwt.sign({ id: user._id, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
		const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;
		await sendEmail(user.email, 'Reset your BikeShare password', `Reset link: ${link}`);
		res.json({ ok: true });
	} catch (err) { next(err); }
};

exports.resetPassword = async (req, res, next) => {
	try {
		const { token, password } = req.body;
		if (!token) return res.status(400).json({ error: 'Token required' });
		const payload = jwt.verify(token, JWT_SECRET);
		if (payload.type !== 'reset') return res.status(400).json({ error: 'Invalid token' });
		const user = await User.findById(payload.id);
		if (!user) return res.status(400).json({ error: 'User not found' });
		const salt = await bcrypt.genSalt(10);
		user.passwordHash = await bcrypt.hash(password, salt);
		await user.save();
		res.json({ ok: true });
	} catch (err) { next(err); }
};

exports.verifyEmail = async (req, res, next) => {
	try {
		const { token } = req.query;
		if (!token) return res.status(400).json({ error: 'Token missing' });
		const payload = jwt.verify(token, JWT_SECRET);
		if (payload.type !== 'verify') return res.status(400).json({ error: 'Invalid token' });
		const user = await User.findById(payload.id);
		if (!user) return res.status(400).json({ error: 'User not found' });
		user.isVerified = true;
		await user.save();
		res.json({ ok: true, message: 'Email verified' });
	} catch (err) { next(err); }
};
