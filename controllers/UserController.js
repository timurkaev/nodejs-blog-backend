import jwt from "jsonwebtoken";
import UserModel from "../models/User.js";
import bcrypt from "bcrypt";
import { validationResult } from "express-validator";

export const register = async (req, res) => {
	try {
		const passwordHash = await req.body.password;
		const salt = await bcrypt.genSalt(10);
		const hash = await bcrypt.hash(passwordHash, salt);

		const doc = new UserModel({
			email: req.body.email,
			fullName: req.body.fullName,
			avatarUrl: req.body.avatarUrl,
			password: hash,
		});

		const user = await doc.save();

		const token = jwt.sign(
			{
				_id: user._id,
			},
			"secretKey",
			{
				expiresIn: "30d",
			},
		);

		const { password, ...UserData } = user._doc;

		res.json({
			...UserData,
			token,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Не удалось зарегистрироваться",
		});
	}
};

export const login = async (req, res) => {
	try {
		const user = await UserModel.findOne({ email: req.body.email });

		if (!user) {
			return res.status(404).json({
				message: "Пользователь не найден",
			});
		}
		const isValidPass = await bcrypt.compare(req.body.password, user._doc.password);
		if (!isValidPass) {
			return res.status(400).json({
				message: "Неверный логин или пароль",
			});
		}
		const token = jwt.sign(
			{
				_id: user._id,
			},
			"SecretKey",
			{
				expiresIn: "30d",
			},
		);
		const { password, ...UserData } = user._doc;
		res.send({
			...UserData,
			token,
		});
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Не удалось авторизоваться",
		});
	}
};

export const getMe = async (req, res) => {
	try {
		const user = await UserModel.findById(req.userId);

		if (!user) {
			return res.status(404).json({
				message: "Пользователь не найден",
			});
		}
		const { password, ...userData } = user._doc;
		res.json({ userData });
	} catch (err) {
		console.log(err);
		res.status(500).json({
			message: "Нет доступа",
		});
	}
};
