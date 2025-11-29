const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');
const Subscription = require('../models/Subscription');

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'user' });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.loginUser = async (req, res) => {
  try {
    console.log('Login request received:', {
      body: req.body,
      headers: req.headers,
      method: req.method,
      url: req.url
    });
    
    const { email, password } = req.body;
    
    // Input validation with better error messages
    if (!email || !password) {
      console.log('Login validation failed - missing email or password');
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    
    // Trim email and validate format
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes('@') || trimmedEmail.length < 5) {
      return res.status(400).json({ message: 'Please enter a valid email address.' });
    }
    
    if (password.length < 1) {
      return res.status(400).json({ message: 'Password is required.' });
    }
    
    // Use lean() for better performance when we don't need the full document
    const user = await User.findOne({ email: trimmedEmail }).select('+password').lean().exec();
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    
    // Compare password with optimized error handling
    let isMatch;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (bcryptError) {
      console.error('Password comparison error:', bcryptError);
      return res.status(500).json({ message: 'Authentication error. Please try again.' });
    }
    
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '7d' }
    );
    
    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      sameSite: 'None',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    
    // Return user data without password
    const userResponse = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };
    
    res.json({ 
      token, 
      user: userResponse,
      message: 'Login successful'
    });
    
  } catch (err) {
    console.error('Login error:', err);
    
    // More specific error messages
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: 'Invalid input data.' });
    } else if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid data format.' });
    } else if (err.code === 11000) {
      return res.status(400).json({ message: 'User already exists.' });
    }
    
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, adminKey } = req.body;
    if (!name || !email || !password || !adminKey) {
      return res.status(400).json({ message: 'All fields and admin key are required.' });
    }
    if (adminKey !== process.env.ADMIN_REGISTRATION_KEY) {
      return res.status(403).json({ message: 'Invalid admin registration key.' });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role: 'admin' });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email required.' });
    const user = await User.findByIdAndUpdate(req.user.id, { name, email }, { new: true });
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Could not update profile.' });
  }
};

exports.changeUserPassword = async (req, res) => {
  try {
    const { current, new: newPassword } = req.body;
    if (!current || !newPassword) return res.status(400).json({ message: 'Current and new password required.' });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    const isMatch = await bcrypt.compare(current, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Current password incorrect.' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: 'Password changed.' });
  } catch (err) {
    res.status(500).json({ message: 'Could not change password.' });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ $or: [ { user: req.user.id }, { user: null } ] }).sort({ createdAt: -1 });
    res.json(notifications.map(n => ({
      _id: n._id,
      title: n.title || 'Notification',
      message: n.message,
      createdAt: n.createdAt,
      read: n.readBy && n.readBy.includes(req.user.id),
    })));
  } catch (err) {
    res.status(500).json({ message: 'Could not fetch notifications.' });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found.' });
    if (!notif.readBy) notif.readBy = [];
    if (!notif.readBy.includes(req.user.id)) {
      notif.readBy.push(req.user.id);
      await notif.save();
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Could not mark as read.' });
  }
};

exports.cancelUserSubscription = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Cancellation reason is required.' });
    }
    
    const sub = await Subscription.findOne({ _id: req.params.id, user: req.user.id });
    if (!sub) return res.status(404).json({ message: 'Subscription not found.' });
    if (sub.canceled && sub.cancellationStatus === 'approved') {
      return res.status(400).json({ message: 'Subscription cancellation already approved.' });
    }
    if (sub.cancellationStatus === 'pending') {
      return res.status(400).json({ message: 'Cancellation request is already pending approval.' });
    }
    if (sub.status !== 'active') return res.status(400).json({ message: 'Only active subscriptions can be canceled.' });
    
    // Set cancellation status to pending (not immediately canceled)
    sub.cancellationStatus = 'pending';
    sub.cancellationReason = reason.trim();
    sub.cancellationRequestDate = new Date();
    await sub.save();
    res.json({ success: true, subscription: sub });
  } catch (err) {
    res.status(500).json({ message: 'Could not cancel subscription.' });
  }
};

exports.renewUserSubscription = async (req, res) => {
  try {
    const { plan } = req.body;
    if (!plan) return res.status(400).json({ message: 'Plan required.' });
    const PlanModel = require('../models/Plan');
    const planDoc = await PlanModel.findOne({ name: new RegExp('^' + plan + '$', 'i') });
    if (!planDoc) return res.status(400).json({ message: 'Plan not found.' });
    const uniqueId = 'SUB-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + planDoc.duration * 24 * 60 * 60 * 1000);
    const subscription = await Subscription.create({
      user: req.user.id,
      plan,
      uniqueId,
      status: 'active',
      expiresAt,
      canceled: false
    });
    res.status(201).json({ subscription });
  } catch (err) {
    res.status(500).json({ message: 'Could not renew subscription.' });
  }
};

exports.autoExpiryNotifications = async (req, res) => {
  try {
    const now = new Date();
    const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
    const start = new Date(in2Days.setHours(0,0,0,0));
    const end = new Date(in2Days.setHours(23,59,59,999));
    const expiringSubs = await Subscription.find({
      expiresAt: { $gte: start, $lte: end },
      status: 'active',
      canceled: { $ne: true }
    });
    const notifiedUsers = [];
    for (const sub of expiringSubs) {
      await Notification.create({
        message: `Your plan (${sub.plan}) will expire in 2 days. Please renew to avoid interruption.`,
        user: sub.user
      });
      notifiedUsers.push(sub.user);
    }
    res.json({ success: true, count: notifiedUsers.length });
  } catch (err) {
    res.status(500).json({ message: 'Could not send auto expiry notifications.' });
  }
};