const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const randomize = require('randomatic');

const app = express();
const PORT = 3001;

app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB with connection pooling
mongoose.connect('mongodb://127.0.0.1:27017/mfa-mern', {
	useNewUrlParser: true,
	useUnifiedTopology: true,
	// poolSize: 10,
});

const User = mongoose.model('User', {
	email: String,
	password: String,
	otp: String,
});

// Function to send OTP to the user's email
async function sendOtpEmail(email, otp) {
	try {
		const transporter = nodemailer.createTransport({
			service: 'gmail',
			auth: {
				// replace with your email and password
				user: 'your-email',
				pass: 'your-password',
			},
		});

		const mailOptions = {
			from: 'your@gmail.com',
			to: email,
			subject: 'OTP Verification',
			text: `Your OTP is: ${otp}`,
		};

		const info =
			await transporter.sendMail(mailOptions);
		console.log('Email sent: ' + info.response);
	} catch (error) {
		console.error('Error sending email:', error);
	}
}

app.post('/auth/login', async (req, res) => {
	const { email, password } = req.body;
	console.log(req.body)

	try {
		const user = await User.findOne({ email, password });
		console.log(user)
		if (!user) {
			return res.json(
				{
					success: false,
					message: 'Invalid credentials'
				}
			);
		}

		const generatedOtp = randomize('0', 6);
		user.otp = generatedOtp;
		await user.save();

		sendOtpEmail(email, generatedOtp);

		return res.json({ success: true });
	} catch (error) {
		console.error('Error during login:', error.message);
		return res.status(500).json(
			{
				success: false,
				message: 'An error occurred during login'
			}
		);
	}
});

app.post('/auth/verify-otp', async (req, res) => {
	const { otp } = req.body;

	try {
		const user = await User.findOne({ otp });

		if (!user) {
			return res.json({ success: false, message: 'Invalid OTP' });
		}

		user.otp = '';
		await user.save();

		return res.json({ success: true });
	} catch (error) {
		console.error('Error during OTP verification:', error.message);
		return res.status(500)
			.json(
				{
					success: false,
					message: 'An error occurred during OTP verification'
				}
			);
	}
});

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`);
});
